<?php

use Illuminate\Support\Facades\Broadcast;

// Allow all private channels for now - we're handling authentication in the controller
Broadcast::channel('conversation.{uuid}', function ($user, $uuid) {
    \Log::info('🔐 Channel authorization - Allowing access', [
        'uuid' => $uuid,
        'user_type' => is_array($user) ? 'anonymous' : 'authenticated'
    ]);
    
    // Allow all access - authentication is handled in the controller
    return true;
});