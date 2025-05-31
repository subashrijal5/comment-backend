import { Button } from '@/components/ui/button';
import { Dialog,  DialogClose,  DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Site } from '@/types/site';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    sites: Site[];
}

export default function Index({ sites }: Props) {
    const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

    const handleDelete = () => {
        if (siteToDelete) {
            router.delete(route('sites.destroy', siteToDelete.id));
        }
        setSiteToDelete(null);
    };

    const confirmDelete = (site: Site) => {
        setSiteToDelete(site);
    };

    return (
        <>
            <Head title="Sites" />
            <div className="container px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
                    <Link href={route('sites.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Site
                        </Button>
                    </Link>
                </div>

                {sites.length === 0 ? (
                    <div className="py-12 text-center">
                        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No sites yet</h3>
                        <p className="mb-4 text-gray-500 dark:text-gray-400">Get started by creating your first site.</p>
                        <Link href={route('sites.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Site
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-md bg-white shadow-sm dark:bg-gray-800">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sites.map((site) => (
                                    <TableRow key={site.id}>
                                        <TableCell className="font-medium">
                                            <Link href={route('sites.show', site.id)} className="hover:underline">
                                                {site.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{site.domain}</TableCell>
                                        <TableCell>{new Date(site.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 focus-visible:ring-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('sites.show', site.id)}>View details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('sites.edit', site.id)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => confirmDelete(site)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <Dialog open={siteToDelete !== null} onOpenChange={() => setSiteToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the site and all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose>Cancel</DialogClose>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Index.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                href: route('sites.index'),
                title: 'Sites',
            },
        ]}
        children={page}
    />
);
