<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\Http\Controllers\{
    BlogController,
    CategoryController,
    TagController
};

// ---------- Public Routes ----------
Route::prefix('blogs')->group(function () {
    // Blog listing + details
    Route::get('/', [BlogController::class, 'index']);
    Route::get('/{slug}', [BlogController::class, 'show']);

    // Blog interactions
    Route::post('/{id}/vote', [BlogController::class, 'vote']);
    Route::post('/{id}/comment', [BlogController::class, 'comment']);
    Route::post('/comments/{commentId}/reply', [BlogController::class, 'reply']);

    // Categories & Tags (public)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/tags', [TagController::class, 'index']);
});

// ---------- Protected Routes (staff/admin only) ----------
Route::prefix('blogs')
    ->middleware(['multi-auth'])
    ->group(function () {
        // Blog management
        Route::post('/', [BlogController::class, 'store']);
        Route::put('/{blog}', [BlogController::class, 'update']);

        // Admin reply to comment
        Route::post('/comments/{id}/admin-reply', [BlogController::class, 'adminReply']);

        // Category & Tag creation
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/tags', [TagController::class, 'store']);
    });