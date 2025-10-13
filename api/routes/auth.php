<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FortifyController;
use App\Http\Controllers\RefreshController;

// Public routes
Route::post('register', [FortifyController::class, 'register']);
Route::post('login', [FortifyController::class, 'login']);
Route::post('forgot-password', [FortifyController::class, 'forgotPassword']);
Route::post('reset-password', [FortifyController::class, 'resetPassword']);
Route::post('refresh', [RefreshController::class, 'me']); // refresh is public

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [FortifyController::class, 'logout']);
    Route::post('logout-all', [FortifyController::class, 'logoutAll']);
    Route::get('profile', [FortifyController::class, 'profile']);
    Route::put('profile', [FortifyController::class, 'updateProfile']);
    Route::post('profile-picture', [FortifyController::class, 'updateProfilePicture']);
});