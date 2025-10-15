<?php

use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\ConversationController;
use Modules\Message\Http\Controllers\MessageController;
use Modules\Message\Http\Controllers\AttachmentController;

Route::prefix('message')->group(function () {
    // Public - client
    Route::post('/conversations', [ConversationController::class, 'store']); // create conversation + first message
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']); // list messages (public)
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']); // send message (public)
    Route::post('/conversations/{conversation}/attachments', [AttachmentController::class, 'store']); // upload attachment (public)

    // Staff / authenticated
    Route::middleware(['multi-auth'])->group(function () {
        Route::get('/conversations', [ConversationController::class, 'index']); // list for employees
        Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
        Route::post('/conversations/{conversation}/join', [ConversationController::class, 'join']); // mark participant
        Route::post('/conversations/{conversation}/assign', [ConversationController::class, 'assign']); // assign staff
        Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
        Route::get('/attachments/{attachment}', [AttachmentController::class, 'show']);
    });
});
