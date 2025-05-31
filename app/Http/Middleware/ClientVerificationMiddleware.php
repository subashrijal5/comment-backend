<?php

namespace App\Http\Middleware;

use App\Models\Site;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClientVerificationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */

    public function handle(Request $request, Closure $next)
    {
        $clientKey = $request->header('X-Client-Key');
        // $providedSignature = $request->header('X-Signature');
        // $timestamp = $request->header('X-Timestamp');
        // TODO: Validate timestamp
        // // Step 1: Validate timestamp (optional, for replay attack protection)
        // if (abs(time() - (int)$timestamp) > 300) {
        //     return response()->json(['message' => 'Request expired'], 401);
        // }

        // Step 2: Find client
        $site = Site::where('client_id', $clientKey)->first();
        if (!$site) {
            return response()->json(['message' => 'Invalid client id'], 401);
        }

        // Step 3: Validate domain (optional)
        $origin = $request->header('Origin');
        if ($origin && !str_contains($origin, $site->domain)) {
            return response()->json(['message' => 'Invalid domain'], 403);
        }
        // TODO: Validate signature
        // Step 4: Validate HMAC signature
        // $body = $request->getContent();
        // $dataToSign = $body . $timestamp; // Concatenate body + timestamp
        // $expectedSignature = hash_hmac('sha256', $dataToSign, $site->client_secret);

        // if (!hash_equals($expectedSignature, $providedSignature)) {
        //     return response()->json(['message' => 'Invalid signature'], 401);
        // }

        $request->merge([
            'site_id' => $site->id,
        ]);

        return $next($request);
    }
}
