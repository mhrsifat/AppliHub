<?php

use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\MessageController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('messages', MessageController::class)->names('message');
});
