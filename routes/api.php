<?php

use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Middleware\ClientVerificationMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('verify', [SiteController::class, 'verify'])->middleware(ClientVerificationMiddleware::class);


Route::prefix('blogs')->group(function () {

    Route::post('/', [BlogController::class, 'store']);
    // Get paginated comments for a blog
    Route::get('/{blog}/comments', [BlogController::class, 'getComments']);

    // Get paginated replies for a specific comment
    Route::get('/{blog}/comments/{comment}/replies', [BlogController::class, 'getReplies']);

    // Add new comment
    Route::post('/{blog}/comments', [BlogController::class, 'comment']);

    // Add/update/remove reaction
    Route::post('/{blog}/reactions', [BlogController::class, 'reaction']);

    // Get live reaction counts (optional endpoint for real-time updates)
    Route::get('/{blog}/reactions/counts', [BlogController::class, 'getReactionCounts']);
    Route::get('/{blog}/comments/{comment}/reactions/counts', [BlogController::class, 'getCommentReactionCounts']);
})->middleware('auth:sanctum');
