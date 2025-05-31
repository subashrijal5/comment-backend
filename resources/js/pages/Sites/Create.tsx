import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    domain: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('sites.store'));
  };

  return (
    <>
      <Head title="Create Site" />
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

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Site</CardTitle>
            <CardDescription>
              Add a new site to manage comments for your website or blog.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="My Awesome Blog"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={data.domain}
                  onChange={(e) => setData('domain', e.target.value)}
                  placeholder="example.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter your domain without http:// or https://
                </p>
                {errors.domain && (
                  <p className="text-sm text-red-500">{errors.domain}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Link href={route('sites.index')}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={processing}>
                {processing ? 'Creating...' : 'Create Site'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}

Create.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={[
    {
      href: route('sites.index'),
      title: 'Sites',
    },
    {
        href: route('sites.create'),
        title: 'Create Site',
    },
]} children={page} />;
