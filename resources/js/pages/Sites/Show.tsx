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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Site } from '@/types/site';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    site: Site;
}

export default function Show({ site }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDelete = () => {
        router.delete(route('sites.destroy', site.id));
        setDeleteDialogOpen(false);
    };

    const copyToken = () => {
        navigator.clipboard.writeText(site.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Head title={site.name} />
            <div className="container py-8 px-4">
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

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="integration">Integration</TabsTrigger>
                        {site.blogs && site.blogs.length > 0 && <TabsTrigger value="blogs">Blogs</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="details">
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
                    </TabsContent>

                    <TabsContent value="integration">
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
                    </TabsContent>

                    {site.blogs && site.blogs.length > 0 && (
                        <TabsContent value="blogs">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Blogs</CardTitle>
                                    <CardDescription>Blogs associated with this site.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {site.blogs.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400">No blogs found for this site.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {site.blogs.map((blog) => (
                                                <li
                                                    key={blog.id}
                                                    className="border-b border-gray-200 pb-2 last:border-0 last:pb-0 dark:border-gray-700"
                                                >
                                                    <h4 className="font-medium">{blog.title}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Created on {new Date(blog.created_at).toLocaleDateString()}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
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

Show.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={[
    {
      href: route('sites.index'),
      title: 'Sites',
    },
    {
        href: "#",
        title: 'Show Site',
    },
]} children={page} />;
