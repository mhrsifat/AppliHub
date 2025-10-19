<?php
// filepath: Modules/Message/Routes/api.php or routes/api.php

use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\ConversationController;
use Modules\Message\Http\Controllers\MessageController;
use Modules\Message\Http\Controllers\AttachmentController;
use Modules\Message\Http\Controllers\TypingController;

/*
|--------------------------------------------------------------------------
| Public Routes (No Authentication Required)
|--------------------------------------------------------------------------
| These routes are accessible by anonymous users for the chat widget
*/

Route::prefix('message')->name('message.')->group(function () {
    
    // Create conversation (anonymous user can start chat)
    Route::post('/conversations', [ConversationController::class, 'store'])
        ->name('conversations.store');
    
    // Get conversation messages by UUID (public access)
    Route::get('/conversations/{conversation:uuid}/messages', [MessageController::class, 'index'])
        ->name('conversations.messages.index');
    
    // Send message to conversation (public - anonymous can reply)
    Route::post('/conversations/{conversation:uuid}/messages', [MessageController::class, 'store'])
        ->name('conversations.messages.store');
    
    // Typing indicators (public)
    Route::post('/conversations/{uuid}/typing', [ConversationController::class, 'typing'])
        ->name('conversations.typing');
    
    Route::post('/conversations/{uuid}/typing/stop', [ConversationController::class, 'typingStop'])
        ->name('conversations.typing.stop');
    
    // View attachment (public with UUID-based security)
    Route::get('/attachments/{id}', [AttachmentController::class, 'show'])
        ->name('attachments.show');
});

/*
|--------------------------------------------------------------------------
| Staff-Only Routes (Authentication Required)
|--------------------------------------------------------------------------
| These routes require staff authentication (admin, employee, manager)
*/

Route::prefix('message')->name('message.')->middleware(['multi-auth'])->group(function () {
    
    // List all conversations (staff dashboard)
    Route::get('/conversations', [ConversationController::class, 'index'])
        ->name('conversations.index');
    
    // Show conversation details (staff can see with auth)
    Route::get('/conversations/{conversation:uuid}', [ConversationController::class, 'show'])
        ->name('conversations.show');
    
    // Join conversation (staff)
    Route::post('/conversations/{conversation:uuid}/join', [ConversationController::class, 'join'])
        ->name('conversations.join');
    
    // Assign conversation to staff
    Route::post('/conversations/{conversation:uuid}/assign', [ConversationController::class, 'assign'])
        ->name('conversations.assign');
    
    // Close conversation
    Route::post('/conversations/{conversation:uuid}/close', [ConversationController::class, 'close'])
        ->name('conversations.close');
    
    // Mark as read
    Route::post('/conversations/{conversation:uuid}/read', [ConversationController::class, 'markAsRead'])
        ->name('conversations.read');
    
    // Add internal note
    Route::post('/conversations/{conversation:uuid}/notes', [ConversationController::class, 'addNote'])
        ->name('conversations.notes.store');
    
    // Delete message (staff only)
    Route::delete('/messages/{id}', [MessageController::class, 'destroy'])
        ->name('messages.destroy');
    
    // Delete attachment (staff only)
    Route::delete('/attachments/{id}', [AttachmentController::class, 'destroy'])
        ->name('attachments.destroy');
});