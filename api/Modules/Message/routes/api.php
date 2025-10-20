<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Modules\Message\Http\Controllers\ConversationController;
use Modules\Message\Http\Controllers\MessageController;
use Modules\Message\Http\Controllers\AttachmentController;
use Modules\Message\Models\Conversation;

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

Route::prefix('message')->name('message.')->middleware(['auth:sanctum'])->group(function () {
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

// Staff/Admin broadcasting auth
Route::post('/broadcasting/auth', function (Request $request) {
    if (!auth()->check()) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }
    
    $user = auth()->user();
    $staffRoles = config('message.staff_roles', ['admin','employee','manager']);
    
    $isStaff = false;
    if (method_exists($user, 'hasAnyRole')) {
        $isStaff = (bool) $user->hasAnyRole($staffRoles);
    } else {
        $isStaff = (bool) ($user->is_staff ?? false);
    }

    if (!$isStaff) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    
    return Broadcast::auth($request);
})->middleware(['auth:sanctum'])->name('broadcasting.auth');

// FIXED: Anonymous user broadcasting auth
Route::post('/broadcasting/auth/anonymous', function (Request $request) {
    \Log::info('Anonymous auth request received', $request->all());

    $channelName = $request->input('channel_name');
    $socketId = $request->input('socket_id');

    if (!$channelName || !$socketId) {
        \Log::error('Missing required parameters', [
            'channel_name' => $channelName,
            'socket_id' => $socketId
        ]);
        return response()->json(['error' => 'Missing channel_name or socket_id'], 400);
    }

    // Validate channel pattern
    if (!preg_match('/^private-conversation\.([a-f0-9-]+)$/', $channelName, $matches)) {
        \Log::error('Invalid channel format', ['channel_name' => $channelName]);
        return response()->json(['error' => 'Invalid channel format'], 400);
    }

    $conversationUuid = $matches[1];
    \Log::info('Extracted conversation UUID', ['uuid' => $conversationUuid]);

    // Get contact from query parameters (Pusher passes custom params as query string)
    $contact = $request->input('contact');
    
    if (!$contact) {
        \Log::error('Contact parameter missing from request');
        return response()->json(['error' => 'Contact parameter required'], 400);
    }

    $conversation = Conversation::where('uuid', $conversationUuid)->first();
    if (!$conversation) {
        \Log::error('Conversation not found', ['uuid' => $conversationUuid]);
        return response()->json(['error' => 'Conversation not found'], 404);
    }

    // Verify the contact matches the conversation
    if ($conversation->created_by_contact !== $contact) {
        \Log::error('Contact mismatch', [
            'provided_contact' => $contact,
            'conversation_contact' => $conversation->created_by_contact
        ]);
        return response()->json(['error' => 'Access denied - contact mismatch'], 403);
    }

    // Create user data for Pusher
    $user = [
        'id' => $contact,
        'name' => $conversation->created_by_name ?? 'Anonymous',
        'is_staff' => false
    ];

    \Log::info('Anonymous auth successful', [
        'conversation_uuid' => $conversationUuid,
        'user' => $user
    ]);

    try {
        // Use the Broadcast facade to generate auth response
        $authResponse = Broadcast::auth($request);
        
        \Log::info('Auth response generated successfully');
        return $authResponse;
        
    } catch (\Exception $e) {
        \Log::error('Pusher auth error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 500);
    }
})->name('broadcasting.anonymous.auth');