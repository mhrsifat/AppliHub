<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RefreshController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::prefix('auth')
    ->middleware('api')
    ->group(base_path('routes/auth.php'));

    

Route::get('me', [RefreshController::class, 'me'])->middleware('auth:sanctum');




