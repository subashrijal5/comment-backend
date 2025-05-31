<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SiteController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the sites.
     */
    public function index()
    {
        $sites = Auth::user()->sites()->latest()->get();

        return Inertia::render('Sites/Index', [
            'sites' => $sites
        ]);
    }

    /**
     * Show the form for creating a new site.
     */
    public function create()
    {
        return Inertia::render('Sites/Create');
    }

    /**
     * Store a newly created site in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => [
                'required',
                'string',
                'regex:/^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/',
                'max:255',
                Rule::unique('sites')->where(function ($query) {
                    return $query->where('user_id', Auth::id());
                }),
            ],
        ]);

        $site = Auth::user()->sites()->create($validated);

        return redirect()->route('sites.index')
            ->with('success', 'Site created successfully.');
    }

    /**
     * Display the specified site.
     */
    public function show(Site $site, Request $request)
    {
        $this->authorize('view', $site);

        $perPage = $request->input('per_page', 10);
        $blogs = $site->blogs()
            ->with(['comments' => function($query) {
                $query->whereNull('parent_id')
                      ->with(['parent', 'reactions']);
            }, 'reactions'])
            ->latest()
            ->paginate($perPage);

        return Inertia::render('Sites/Show', [
            'site' => $site,
            'blogs' => $blogs
        ]);
    }

    /**
     * Show the form for editing the specified site.
     */
    public function edit(Site $site)
    {
        $this->authorize('update', $site);

        return Inertia::render('Sites/Edit', [
            'site' => $site
        ]);
    }

    /**
     * Update the specified site in storage.
     */
    public function update(Request $request, Site $site)
    {
        $this->authorize('update', $site);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => [
                'required',
                'string',
                'regex:/^(?!https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/',
                'max:255',
                Rule::unique('sites')->where(function ($query) {
                    return $query->where('user_id', Auth::id());
                })->ignore($site->id),
            ],
        ]);

        $site->update($validated);

        return redirect()->route('sites.index')
            ->with('success', 'Site updated successfully.');
    }

    /**
     * Remove the specified site from storage.
     */
    public function destroy(Site $site)
    {
        $this->authorize('delete', $site);

        $site->delete();

        return redirect()->route('sites.index')
            ->with('success', 'Site deleted successfully.');
    }
}
