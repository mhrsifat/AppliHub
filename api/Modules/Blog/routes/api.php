<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\Http\Controllers\BlogController;
use Modules\Blog\Http\Controllers\CategoryController;
use Modules\Blog\Http\Controllers\TagController;

Route::get('blogs', [BlogController::class, 'index']);
Route::get('blogs/{slug}', [BlogController::class, 'show']);
Route::post('blogs', [BlogController::class, 'store']); // protect with auth middleware in real app
Route::put('blogs/{blog}', [BlogController::class, 'update']); // auth

Route::post('blogs/{id}/vote', [BlogController::class, 'vote']);
Route::post('blogs/{id}/comment', [BlogController::class, 'comment']);
Route::post('comments/{id}/reply', [BlogController::class, 'adminReply']); // admin reply to comment

Route::get('categories', [CategoryController::class, 'index']);
Route::post('categories', [CategoryController::class, 'store']); // auth

Route::get('tags', [TagController::class, 'index']);
Route::post('tags', [TagController::class, 'store']); // auth

