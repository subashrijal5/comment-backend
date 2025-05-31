<?php

use App\Http\Controllers\Api\SiteController;
use App\Http\Middleware\ClientVerificationMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('verify', [SiteController::class, 'verify'])->middleware(ClientVerificationMiddleware::class);
