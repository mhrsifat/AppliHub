<?php

use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\MessageController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('messages', MessageController::class)->names('message');
});
