<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\Request;

class SiteController extends Controller
{

    /**
     * Display the specified resource.
     */
    public function verify(Request $request)
    {
        $site = Site::find($request->site_id);
        $token = $site->createToken('site-token');
        return response()->json([
            'message' => 'Client verified successfully',
            'token' => $token->plainTextToken,
            'site' => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
            ],
        ]);
    }
}
