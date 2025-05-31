import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import AppLayout from '@/layouts/app-layout';
import { Blog, PaginatedData, Site } from '@/types/site';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Heart, MessageCircle, Pencil, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    site: Site;
    blogs: PaginatedData<Blog>;
}

export default function Show({ site, blogs }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    const handleDelete = () => {
        router.delete(route('sites.destroy', site.id));
        setDeleteDialogOpen(false);
    };

    const copyToken = () => {
        navigator.clipboard.writeText(site.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleComments = (blogId: number) => {
        setExpandedComments((prev) => ({
            ...prev,
            [blogId]: !prev[blogId],
        }));
    };

    const toggleReplies = (commentId: number) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    const handlePageChange = (page: number) => {
        router.visit(route('sites.show', site.id), {
            data: { page },
            preserveState: true,
            preserveScroll: true,
            only: ['blogs'],
        });
    };

    return (
        <>
            <Head title={site.name} />
            <div className="container px-4 py-8">
                <div className="mb-6">
                    <Link
                        href={route('sites.index')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sites
                    </Link>
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
                    <div className="flex space-x-2">
                        <Link href={route('sites.edit', site.id)}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Details</CardTitle>
                            <CardDescription>Information about your site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                <p className="mt-1">{site.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</h3>
                                <p className="mt-1">{site.domain}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                                <p className="mt-1">{new Date(site.created_at).toLocaleDateString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Integration</CardTitle>
                            <CardDescription>Use this token to integrate comments on your site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Site Token</h3>
                                <div className="flex">
                                    <div className="flex-1 overflow-x-auto rounded-l-md bg-gray-100 p-2 font-mono text-sm whitespace-nowrap dark:bg-gray-800">
                                        {site.token}
                                    </div>
                                    <Button variant="outline" className="rounded-l-none" onClick={copyToken}>
                                        {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Integration Code</h3>
                                <div className="overflow-x-auto rounded-md bg-gray-100 p-4 dark:bg-gray-800">
                                    <pre className="text-sm">
                                        {`<script src="https://yourapp.com/js/comments.js" data-site-id="${site.token}"></script>`}
                                    </pre>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Add this code to your website where you want the comments to appear.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-bold">Blogs</h2>
                    {blogs.data.length > 0 ? (
                        <div className="space-y-6">
                            {blogs.data.map((blog) => (
                                <Card key={blog.id} className="overflow-hidden">
                                    <CardHeader className="bg-gray-50 dark:bg-gray-800">
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <a href={blog.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {blog.url}
                                            </a>
                                            <span className="text-xs text-gray-500">{new Date(blog.created_at).toLocaleDateString()}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="mb-2 flex items-center space-x-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleComments(blog.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                <MessageCircle className="mr-1 h-4 w-4" />
                                                {blog.comments?.length || 0} Comments
                                            </Button>

                                            <div className="flex items-center space-x-2">
                                                {blog.reactions?.map((reaction) => (
                                                    <div key={reaction.id} className="flex items-center text-sm">
                                                        {reaction.type === 'like' && <ThumbsUp className="mr-1 h-4 w-4 text-blue-500" />}
                                                        {reaction.type === 'dislike' && <ThumbsDown className="mr-1 h-4 w-4 text-red-500" />}
                                                        {reaction.type === 'heart' && <Heart className="mr-1 h-4 w-4 text-pink-500" />}
                                                        <span>{reaction.total}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {expandedComments[blog.id] && blog.comments && blog.comments.length > 0 && (
                                            <div className="mt-4 space-y-4">
                                                {blog.comments.map((comment) => (
                                                    <div key={comment.id} className="rounded-md border bg-gray-50 p-3 dark:bg-gray-800">
                                                        <div className="flex justify-between">
                                                            <h4 className="font-medium">{comment.name}</h4>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(comment.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm">{comment.body}</p>

                                                        <div className="mt-2 flex items-center space-x-4">
                                                            {comment.replies && comment.replies.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleReplies(comment.id)}
                                                                    className="text-xs text-gray-600 hover:text-gray-900"
                                                                >
                                                                    {expandedReplies[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} Replies
                                                                </Button>
                                                            )}

                                                            <div className="flex items-center space-x-2">
                                                                {comment.reactions?.map((reaction) => (
                                                                    <div key={reaction.id} className="flex items-center text-xs">
                                                                        {reaction.type === 'like' && (
                                                                            <ThumbsUp className="mr-1 h-3 w-3 text-blue-500" />
                                                                        )}
                                                                        {reaction.type === 'dislike' && (
                                                                            <ThumbsDown className="mr-1 h-3 w-3 text-red-500" />
                                                                        )}
                                                                        {reaction.type === 'heart' && (
                                                                            <Heart className="mr-1 h-3 w-3 text-pink-500" />
                                                                        )}
                                                                        <span>{reaction.total}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {expandedReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                                                            <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                                                                {comment.replies.map((reply) => (
                                                                    <div key={reply.id} className="rounded-md border bg-white p-2 dark:bg-gray-700">
                                                                        <div className="flex justify-between">
                                                                            <h5 className="text-sm font-medium">{reply.name}</h5>
                                                                            <span className="text-xs text-gray-500">
                                                                                {new Date(reply.created_at).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-1 text-xs">{reply.body}</p>

                                                                        <div className="mt-1 flex items-center space-x-2">
                                                                            {reply.reactions?.map((reaction) => (
                                                                                <div key={reaction.id} className="flex items-center text-xs">
                                                                                    {reaction.type === 'like' && (
                                                                                        <ThumbsUp className="mr-1 h-3 w-3 text-blue-500" />
                                                                                    )}
                                                                                    {reaction.type === 'dislike' && (
                                                                                        <ThumbsDown className="mr-1 h-3 w-3 text-red-500" />
                                                                                    )}
                                                                                    {reaction.type === 'heart' && (
                                                                                        <Heart className="mr-1 h-3 w-3 text-pink-500" />
                                                                                    )}
                                                                                    <span>{reaction.total}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            {blogs.last_page > 1 && (
                                <div className="mt-6">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(Math.max(1, blogs.current_page - 1))}
                                                    className={blogs.current_page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: blogs.last_page }, (_, i) => i + 1)
                                                .map((page) => {
                                                    // Show ellipsis for large page ranges
                                                    if (blogs.last_page > 7) {
                                                        // Always show first and last page
                                                        if (page === 1 || page === blogs.last_page) {
                                                            return (
                                                                <PaginationItem key={page}>
                                                                    <PaginationLink
                                                                        onClick={() => handlePageChange(page)}
                                                                        isActive={page === blogs.current_page}
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        // Show pages around current page
                                                        if (Math.abs(page - blogs.current_page) <= 1) {
                                                            return (
                                                                <PaginationItem key={page}>
                                                                    <PaginationLink
                                                                        onClick={() => handlePageChange(page)}
                                                                        isActive={page === blogs.current_page}
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        // Show ellipsis
                                                        if (page === 2 || page === blogs.last_page - 1) {
                                                            return (
                                                                <PaginationItem key={page}>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        return null;
                                                    }

                                                    // Show all pages if there are few
                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                onClick={() => handlePageChange(page)}
                                                                isActive={page === blogs.current_page}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                })
                                                .filter(Boolean)}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => handlePageChange(Math.min(blogs.last_page, blogs.current_page + 1))}
                                                    className={blogs.current_page >= blogs.last_page ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-gray-500">No blogs found for this site.</p>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the site and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Show.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                href: route('sites.index'),
                title: 'Sites',
            },
            {
                href: '#',
                title: 'Show Site',
            },
        ]}
        children={page}
    />
);
