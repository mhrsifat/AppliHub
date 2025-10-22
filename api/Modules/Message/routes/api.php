<?php

use Modules\Message\Http\Controllers\BroadcastAuthController;
use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\ConversationController;
use Modules\Message\Http\Controllers\MessageController;
use Modules\Message\Http\Controllers\AttachmentController;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Public Routes (No Authentication Required) - Anonymous Users
|--------------------------------------------------------------------------
*/

Route::prefix('message')->name('message.')->group(function () {
    // Start new conversation (anonymous)
    Route::post('/conversations', [ConversationController::class, 'store'])
        ->name('conversations.store');
    
    // Get conversation details (with UUID validation)
    Route::get('/conversations/{conversation:uuid}', [ConversationController::class, 'show'])
        ->name('conversations.show');
    
    // Get messages for conversation
    Route::get('/conversations/{conversation:uuid}/messages', [MessageController::class, 'index'])
        ->name('conversations.messages.index');
    
    // Send message to conversation
    Route::post('/conversations/{conversation:uuid}/messages', [MessageController::class, 'store'])
        ->name('conversations.messages.store');
    
    // Typing indicators
    Route::post('/conversations/{conversation:uuid}/typing', [ConversationController::class, 'typing'])
        ->name('conversations.typing');
    
    Route::post('/conversations/{conversation:uuid}/typing/stop', [ConversationController::class, 'typingStop'])
        ->name('conversations.typing.stop');
    
    // View attachments
    Route::get('/attachments/{id}', [AttachmentController::class, 'show'])
        ->name('attachments.show');
});

/*
|--------------------------------------------------------------------------
| Staff-Only Routes (Authentication Required)
|--------------------------------------------------------------------------
*/

Route::prefix('message')->name('message.')->middleware(['multi-auth'])->group(function () {
    // List conversations for staff
    Route::get('/conversations', [ConversationController::class, 'index'])
        ->name('conversations.index');
    
    // Staff actions on conversations
    Route::post('/conversations/{conversation:uuid}/join', [ConversationController::class, 'join'])
        ->name('conversations.join');
    
    Route::post('/conversations/{conversation:uuid}/assign', [ConversationController::class, 'assign'])
        ->name('conversations.assign');
    
    Route::post('/conversations/{conversation:uuid}/close', [ConversationController::class, 'close'])
        ->name('conversations.close');
    
    Route::post('/conversations/{conversation:uuid}/read', [ConversationController::class, 'markAsRead'])
        ->name('conversations.read');
    
    // Internal notes (staff only)
    Route::post('/conversations/{conversation:uuid}/notes', [ConversationController::class, 'addNote'])
        ->name('conversations.notes.store');
    
    // Delete messages and attachments (staff only)
    Route::delete('/messages/{id}', [MessageController::class, 'destroy'])
        ->name('messages.destroy');
    
    Route::delete('/attachments/{id}', [AttachmentController::class, 'destroy'])
        ->name('attachments.destroy');
});

/*
|--------------------------------------------------------------------------
| Broadcasting Authentication Routes
|--------------------------------------------------------------------------
*/

// For authenticated users (both regular users and staff)
Route::post('/broadcasting/auth', [BroadcastAuthController::class, 'authenticate'])
    ->middleware(['auth:sanctum']);

// For anonymous users - use web middleware for form parsing
Route::post('/broadcasting/auth/anonymous', [BroadcastAuthController::class, 'authenticateAnonymous'])
    ->middleware(['api']);