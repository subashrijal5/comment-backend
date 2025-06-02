<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Reaction;
use App\Rules\RelativePath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class BlogController extends Controller
{
    const CACHE_TTL = 3600; // 1 hour
    const BATCH_SIZE = 100; // Reactions to process per batch
    const BULK_UPDATE_DELAY = 30; // seconds before bulk update

    public function store(Request $request)
    {
        $validated = $request->validate([
            'url' => ['required', new RelativePath(), 'max:255'],
            'site_id' => 'required|exists:sites,id',
        ], [
            'url.required' => 'URL is required',
            'url.regex' => 'Invalid URL format, URL should be a relative URL',
        ]);

        $blog = Blog::firstOrCreate([
            'url' => $validated['url'],
            'site_id' => $validated['site_id'],
        ]);

        // Only add basic blog info with cached reaction counts
        $blog->reaction_counts = $this->getCachedReactionCounts($blog->id);
        $blog->total_comments = $this->getCachedCommentCount($blog->id);

        return response()->json([
            'message' => 'Blog created successfully',
            'blog' => $blog,
        ]);
    }

    /**
     * Get paginated comments for a blog
     */
    public function getComments(Request $request, Blog $blog)
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:50',
            'sort' => 'in:newest,oldest,popular',
        ]);

        $perPage = $validated['per_page'] ?? 10;
        $sort = $validated['sort'] ?? 'newest';

        // Build query for top-level comments only
        $query = Comment::where('blog_id', $blog->id)
                       ->with(['replies'=> fn($q)=> $q->limit(3)])
                       ->whereNull('parent_id');

        // Apply sorting
        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'popular':
                $query->withCount(['reactions as like_count' => function ($q) {
                    $q->where('type', 'like');
                }])->orderByDesc('like_count');
                break;
            default: // newest
                $query->orderBy('created_at', 'desc');
        }

        $comments = $query->paginate($perPage);

        // Add cached reaction counts and reply counts to each comment
        $comments->getCollection()->transform(function ($comment) use ($blog) {
            $comment->reaction_counts = $this->getCachedReactionCounts($blog->id, $comment->id);
            $comment->reply_count = $this->getCachedReplyCount($comment->id);
            return $comment;
        });

        return response()->json([
            'comments' => $comments->items(),
            'pagination' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
                'has_more' => $comments->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get paginated replies for a comment
     */
    public function getReplies(Request $request, Blog $blog, Comment $comment)
    {
        $validated = $request->validate([
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:20',
        ]);

        $perPage = $validated['per_page'] ?? 5;

        $replies = Comment::where('parent_id', $comment->id)
                         ->orderBy('created_at', 'asc')
                         ->paginate($perPage);

        // Add cached reaction counts to each reply
        $replies->getCollection()->transform(function ($reply) use ($blog) {
            $reply->reaction_counts = $this->getCachedReactionCounts($blog->id, $reply->id);
            return $reply;
        });

        return response()->json([
            'replies' => $replies->items(),
            'pagination' => [
                'current_page' => $replies->currentPage(),
                'last_page' => $replies->lastPage(),
                'per_page' => $replies->perPage(),
                'total' => $replies->total(),
                'has_more' => $replies->hasMorePages(),
            ],
        ]);
    }

    public function comment(Request $request, Blog $blog)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:comments,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'body' => 'required|string|min:3|max:1000',
        ]);

        $comment = Comment::create([
            ...$validated,
            'blog_id' => $blog->id,
        ]);

        // Update comment count caches
        $this->updateCommentCountCache($blog->id, $validated['parent_id'] ?? null);

        // Clear related caches if needed
        $this->clearBlogCaches($blog->id);

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => $comment,
        ]);
    }

    public function reaction(Request $request, Blog $blog)
    {
        $validated = $request->validate([
            'comment_id' => 'nullable|exists:comments,id',
            'type' => 'required|in:like,love,laugh,surprised,sad',
        ]);

        $validated['visitor_id'] = $request->user();
        Log::info($request->site());
        try {
            DB::beginTransaction();

            // Handle the reaction immediately for user experience
            $result = $this->handleReactionImmediate($blog, $validated);
            
            // Queue for bulk update (Redis-based)
            $this->queueReactionForBulkUpdate($blog, $validated, $result['operation']);
            
            // Update cached counts immediately for real-time experience
            $this->updateCachedReactionCounts($blog, $validated, $result['operation']);

            DB::commit();

            return response()->json([
                'message' => $result['message'],
                'reaction' => $result['reaction'],
                'counts' => $this->getCachedReactionCounts($blog->id, $validated['comment_id'] ?? null),
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Reaction error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to process reaction'], 500);
        }
    }

    /**
     * Handle reaction immediately for user experience
     */
    private function handleReactionImmediate(Blog $blog, array $validated)
    {
        $existingReaction = Reaction::where([
            'visitor_id' => $validated['visitor_id'],
            'blog_id' => $blog->id,
            'comment_id' => $validated['comment_id'] ?? null,
        ])->first();

        if ($existingReaction) {
            if ($validated['type'] === 'remove') {
                $existingReaction->delete();
                return [
                    'message' => 'Reaction deleted successfully',
                    'reaction' => $existingReaction,
                    'operation' => 'delete'
                ];
            }
            
            $oldType = $existingReaction->type;
            $existingReaction->update(['type' => $validated['type']]);
            
            return [
                'message' => 'Reaction updated successfully',
                'reaction' => $existingReaction,
                'operation' => 'update',
                'old_type' => $oldType
            ];
        }

        if ($validated['type'] !== 'remove') {
            $reaction = Reaction::create([
                'type' => $validated['type'],
                'blog_id' => $blog->id,
                'comment_id' => $validated['comment_id'] ?? null,
                'visitor_id' => $validated['visitor_id'],
            ]);

            return [
                'message' => 'Reaction created successfully',
                'reaction' => $reaction,
                'operation' => 'create'
            ];
        }

        return [
            'message' => 'No reaction to remove',
            'reaction' => null,
            'operation' => 'none'
        ];
    }

    /**
     * Queue reaction for bulk update processing
     */
    private function queueReactionForBulkUpdate(Blog $blog, array $validated, string $operation)
    {
        $key = "reaction_queue:blog_{$blog->id}";
        $data = [
            'blog_id' => $blog->id,
            'comment_id' => $validated['comment_id'] ?? null,
            'visitor_id' => $validated['visitor_id'],
            'type' => $validated['type'],
            'operation' => $operation,
            'timestamp' => now()->timestamp,
        ];

        // Get existing queue items
        $existingQueue = Cache::get($key, []);
        $existingQueue[] = $data;
        
        // Store updated queue with TTL
        Cache::put($key, $existingQueue, now()->addSeconds(self::BULK_UPDATE_DELAY + 60));

        // Schedule bulk update if not already scheduled
        $lockKey = "bulk_update_scheduled:blog_{$blog->id}";
        if (!Cache::has($lockKey)) {
            Cache::put($lockKey, 1, now()->addSeconds(self::BULK_UPDATE_DELAY));
            
            // In a real application, you'd dispatch a job here
            // dispatch(new BulkUpdateReactionsJob($blog->id))->delay(now()->addSeconds(self::BULK_UPDATE_DELAY));
        }
    }

    /**
     * Update cached reaction counts immediately
     */
    private function updateCachedReactionCounts(Blog $blog, array $validated, string $operation)
    {
        $cacheKey = $this->getReactionCountCacheKey($blog->id, $validated['comment_id'] ?? null);
        $counts = Cache::get($cacheKey, ['like' => 0, 'dislike' => 0]);

        switch ($operation) {
            case 'create':
                $counts[$validated['type']] = ($counts[$validated['type']] ?? 0) + 1;
                break;
                
            case 'update':
                // This would need the old type to decrement properly
                // For now, we'll refresh from database
                $counts = $this->getReactionCountsFromDatabase($blog->id, $validated['comment_id'] ?? null);
                break;
                
            case 'delete':
                if (isset($counts[$validated['type']])) {
                    $counts[$validated['type']] = max(0, $counts[$validated['type']] - 1);
                }
                break;
        }

        Cache::put($cacheKey, $counts, now()->addSeconds(self::CACHE_TTL));
    }

    /**
     * Get cached reaction counts
     */
    private function getCachedReactionCounts(int $blogId, ?int $commentId = null)
    {
        $cacheKey = $this->getReactionCountCacheKey($blogId, $commentId);
        
        return Cache::remember($cacheKey, now()->addSeconds(self::CACHE_TTL), function () use ($blogId, $commentId) {
            return $this->getReactionCountsFromDatabase($blogId, $commentId);
        });
    }

    /**
     * Get reaction counts from database
     */
    private function getReactionCountsFromDatabase(int $blogId, ?int $commentId = null)
    {
        $query = Reaction::where('blog_id', $blogId);
        
        if ($commentId) {
            $query->where('comment_id', $commentId);
        } else {
            $query->whereNull('comment_id');
        }

        return $query->groupBy('type')
                    ->selectRaw('type, COUNT(*) as count')
                    ->pluck('count', 'type')
                    ->toArray();
    }

    /**
     * Get cached comment count for a blog
     */
    private function getCachedCommentCount(int $blogId)
    {
        $cacheKey = "comment_count:blog_{$blogId}";
        
        return Cache::remember($cacheKey, now()->addSeconds(self::CACHE_TTL), function () use ($blogId) {
            return Comment::where('blog_id', $blogId)->count();
        });
    }

    /**
     * Get cached reply count for a comment
     */
    private function getCachedReplyCount(int $commentId)
    {
        $cacheKey = "reply_count:comment_{$commentId}";
        
        return Cache::remember($cacheKey, now()->addSeconds(self::CACHE_TTL), function () use ($commentId) {
            return Comment::where('parent_id', $commentId)->count();
        });
    }

    /**
     * Update comment count cache when new comment is added
     */
    private function updateCommentCountCache(int $blogId, ?int $parentId = null)
    {
        // Update blog comment count
        $blogCacheKey = "comment_count:blog_{$blogId}";
        $currentCount = Cache::get($blogCacheKey, 0);
        Cache::put($blogCacheKey, $currentCount + 1, now()->addSeconds(self::CACHE_TTL));

        // Update reply count if it's a reply
        if ($parentId) {
            $replyCacheKey = "reply_count:comment_{$parentId}";
            $currentReplyCount = Cache::get($replyCacheKey, 0);
            Cache::put($replyCacheKey, $currentReplyCount + 1, now()->addSeconds(self::CACHE_TTL));
        }
    }

    /**
     * Generate cache key for reaction counts
     */
    private function getReactionCountCacheKey(int $blogId, ?int $commentId = null)
    {
        return $commentId 
            ? "reaction_counts:blog_{$blogId}:comment_{$commentId}"
            : "reaction_counts:blog_{$blogId}";
    }

    /**
     * Clear all related blog caches
     */
    private function clearBlogCaches(int $blogId)
    {
        $keysToForget = [
            "comment_count:blog_{$blogId}",
        ];
        
        // Clear specific keys
        foreach ($keysToForget as $key) {
            Cache::forget($key);
        }
        
        // For pattern-based clearing (reaction_counts, reply_counts), we need to track keys
        // Since we can't use wildcard deletes with all cache drivers, we'll use tags instead
        Cache::tags(["blog_{$blogId}"])->flush();
    }



    /**
     * Get reaction counts endpoint
     */
    public function getReactionCounts(Blog $blog)
    {
        return response()->json([
            'reaction_counts' => $this->getCachedReactionCounts($blog->id),
        ]);
    }

    /**
     * Get comment reaction counts endpoint
     */
    public function getCommentReactionCounts(Blog $blog, Comment $comment)
    {
        return response()->json([
            'reaction_counts' => $this->getCachedReactionCounts($blog->id, $comment->id),
        ]);
    }

 
    public function processBulkReactionUpdates(int $blogId)
    {
        $key = "reaction_queue:blog_{$blogId}";
        $lockKey = "bulk_processing:blog_{$blogId}";

        // Prevent concurrent processing
        if (Cache::has($lockKey)) {
            return;
        }

        Cache::put($lockKey, 1, now()->addSeconds(300)); // 5 minute lock

        try {
            $reactions = [];
            
            // Get all queued reactions
            while ($item = Redis::rpop($key)) {
                $reactions[] = json_decode($item, true);
                
                // Process in batches
                if (count($reactions) >= self::BATCH_SIZE) {
                    $this->processBatch($reactions);
                    $reactions = [];
                }
            }

            // Process remaining reactions
            if (!empty($reactions)) {
                $this->processBatch($reactions);
            }

            // Refresh cached counts from database
            $this->refreshReactionCounts($blogId);

        } finally {
            Cache::forget($lockKey);
        }
    }

    /**
     * Process a batch of reactions
     */
    private function processBatch(array $reactions)
    {
        // Group reactions by operation type for efficient processing
        $grouped = collect($reactions)->groupBy('operation');

        foreach ($grouped as $operation => $items) {
            switch ($operation) {
                case 'create':
                    $this->bulkCreateReactions($items);
                    break;
                case 'update':
                    $this->bulkUpdateReactions($items);
                    break;
                case 'delete':
                    $this->bulkDeleteReactions($items);
                    break;
            }
        }
    }

    private function bulkCreateReactions($reactions)
    {
        $data = $reactions->map(function ($reaction) {
            return [
                'type' => $reaction['type'],
                'blog_id' => $reaction['blog_id'],
                'comment_id' => $reaction['comment_id'] ?? null,
                'visitor_id' => $reaction['visitor_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->toArray();

        Reaction::insert($data);
    }

    private function bulkUpdateReactions($reactions)
    {
        foreach ($reactions as $reaction) {
            Reaction::where([
                'visitor_id' => $reaction['visitor_id'],
                'blog_id' => $reaction['blog_id'],
                'comment_id' => $reaction['comment_id'] ?? null,
            ])->update([
                'type' => $reaction['type'],
                'updated_at' => now(),
            ]);
        }
    }

    private function bulkDeleteReactions($reactions)
    {
        $conditions = $reactions->map(function ($reaction) {
            return [
                'visitor_id' => $reaction['visitor_id'],
                'blog_id' => $reaction['blog_id'],
                'comment_id' => $reaction['comment_id'] ?? null,
            ];
        });

        foreach ($conditions as $condition) {
            Reaction::where($condition)->delete();
        }
    }

    /**
     * Refresh reaction counts from database
     */
    private function refreshReactionCounts(int $blogId)
    {
        // Clear existing caches
        $this->clearBlogCaches($blogId);

        // Pre-warm cache with fresh data
        $blog = Blog::with('comments')->find($blogId);
        
        if ($blog) {
            // Cache blog reaction counts
            $this->getCachedReactionCounts($blogId);
            
            // Cache comment reaction counts
            foreach ($blog->comments as $comment) {
                $this->getCachedReactionCounts($blogId, $comment->id);
            }
        }
    }
}