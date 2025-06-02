<?php

namespace App\Services;

use App\Events\ReactionUpdated;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Redis;

class RealtimeReactionService
{
    /**
     * Broadcast reaction update to all connected users
     */
    public function broadcastReactionUpdate(int $blogId, ?int $commentId, array $counts, string $visitorId)
    {
        $channelName = $commentId
            ? "blog.{$blogId}.comment.{$commentId}"
            : "blog.{$blogId}";

        // Broadcast to all users except the one who made the reaction
        broadcast(new ReactionUpdated([
            'blogId' => $blogId,
            'commentId' => $commentId,
            'counts' => $counts,
            'excludeVisitor' => $visitorId
        ]))->toOthers();
    }

    /**
     * Get live reaction counts with real-time updates
     */
    public function getLiveReactionCounts(int $blogId, ?int $commentId = null)
    {
        $cacheKey = $commentId
            ? "live_reaction_counts:blog_{$blogId}:comment_{$commentId}"
            : "live_reaction_counts:blog_{$blogId}";

        return Cache::store('redis')->remember($cacheKey, 60, function () use ($blogId, $commentId) {
            // Get base counts from database
            $query = \App\Models\Reaction::where('blog_id', $blogId);

            if ($commentId) {
                $query->where('comment_id', $commentId);
            } else {
                $query->whereNull('comment_id');
            }

            $counts = $query->groupBy('type')
                ->selectRaw('type, COUNT(*) as count')
                ->pluck('count', 'type')
                ->toArray();

            // Add pending changes from Redis queue
            $pending = $this->getPendingReactionChanges($blogId, $commentId);

            foreach ($pending as $type => $change) {
                $counts[$type] = ($counts[$type] ?? 0) + $change;
                $counts[$type] = max(0, $counts[$type]); // Ensure non-negative
            }

            return $counts;
        });
    }

    /**
     * Get pending reaction changes from Redis queue
     */
    private function getPendingReactionChanges(int $blogId, ?int $commentId = null)
    {
        $key = "reaction_queue:blog_{$blogId}";
        $items = Redis::lrange($key, 0, -1);

        $changes = ['like' => 0, 'dislike' => 0];

        foreach ($items as $item) {
            $data = json_decode($item, true);

            // Only count changes for the specific comment (or blog if commentId is null)
            if (($data['comment_id'] ?? null) !== $commentId) {
                continue;
            }

            switch ($data['operation']) {
                case 'create':
                    $changes[$data['type']]++;
                    break;
                case 'delete':
                    $changes[$data['type']]--;
                    break;
                case 'update':
                    // For updates, we need to know the old type
                    // This is simplified - in practice you'd track this better
                    break;
            }
        }

        return $changes;
    }

    /**
     * Clean up old reaction queues
     */
    public function cleanupOldQueues()
    {
        $pattern = "reaction_queue:blog_*";
        $keys = Redis::keys($pattern);

        foreach ($keys as $key) {
            $items = Redis::lrange($key, 0, -1);
            $validItems = [];

            foreach ($items as $item) {
                $data = json_decode($item, true);

                // Keep items that are less than 5 minutes old
                if (now()->timestamp - $data['timestamp'] < 300) {
                    $validItems[] = $item;
                }
            }

            // Replace the queue with only valid items
            Redis::delete($key);
            if (!empty($validItems)) {
                Redis::lpush($key, ...$validItems);
            }
        }
    }
}
