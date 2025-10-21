<?php

namespace Modules\Message\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class BroadcastAuthController extends Controller
{
    /**
     * Authenticate the request for channel access for anonymous users
     */
    public function authenticateAnonymous(Request $request)
    {
        try {
            Log::info('🔐 Anonymous broadcast auth request', [
                'channel' => $request->channel_name,
                'socket_id' => $request->socket_id,
                'contact' => $request->contact,
                'conversation_uuid' => $request->conversation_uuid
            ]);

            $channelName = $request->channel_name;
            
            // Validate channel name format
            if (!preg_match('/^private-conversation\.([a-f0-9-]+)$/', $channelName, $matches)) {
                Log::warning('❌ Invalid channel format', ['channel' => $channelName]);
                return response()->json(['error' => 'Invalid channel format'], 403);
            }

            $conversationUuid = $matches[1];
            $contact = $request->contact;

            if (!$contact) {
                Log::warning('❌ No contact provided for anonymous auth');
                return response()->json(['error' => 'Contact information required'], 403);
            }

            Log::info('🔧 Allowing anonymous access', [
                'conversation_uuid' => $conversationUuid,
                'contact' => $contact
            ]);

            // Create manual Pusher auth response
            return $this->createPusherAuthResponse($request);

        } catch (\Exception $e) {
            Log::error('💥 Anonymous broadcast auth error', [
                'error' => $e->getMessage(),
                'channel' => $request->channel_name,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 403);
        }
    }

    /**
     * Authenticate the request for channel access for authenticated users
     */
    public function authenticate(Request $request)
    {
        try {
            $user = $request->user();
            
            Log::info('🔐 Authenticated broadcast auth request', [
                'channel' => $request->channel_name,
                'socket_id' => $request->socket_id,
                'user_id' => $user ? $user->id : 'null',
                'user_name' => $user ? $user->name : 'null'
            ]);

            $channelName = $request->channel_name;
            
            // Validate channel name format
            if (!preg_match('/^private-conversation\.([a-f0-9-]+)$/', $channelName, $matches)) {
                Log::warning('❌ Invalid channel format for authenticated user', ['channel' => $channelName]);
                return response()->json(['error' => 'Invalid channel format'], 403);
            }

            $conversationUuid = $matches[1];

            if (!$user) {
                Log::warning('❌ No authenticated user found');
                return response()->json(['error' => 'Authentication required'], 401);
            }

            Log::info('🔧 Allowing authenticated user access', [
                'conversation_uuid' => $conversationUuid,
                'user_id' => $user->id,
                'user_name' => $user->name
            ]);

            // Create manual Pusher auth response for authenticated user
            return $this->createPusherAuthResponse($request);

        } catch (\Exception $e) {
            Log::error('💥 Authenticated broadcast auth error', [
                'error' => $e->getMessage(),
                'channel' => $request->channel_name,
                'user_id' => $request->user() ? $request->user()->id : 'null'
            ]);

            return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 403);
        }
    }

    /**
     * Manual Pusher auth response - completely bypass Laravel broadcasting
     */
    protected function createPusherAuthResponse(Request $request)
    {
        $channelName = $request->channel_name;
        $socketId = $request->socket_id;

        try {
            $pusherConfig = config('broadcasting.connections.pusher');
            $appKey = $pusherConfig['key'] ?? '';
            $appSecret = $pusherConfig['secret'] ?? '';

            if (!$appKey || !$appSecret) {
                Log::error('❌ Pusher configuration missing', [
                    'has_key' => !empty($appKey),
                    'has_secret' => !empty($appSecret)
                ]);
                return response()->json(['error' => 'Pusher configuration incomplete'], 500);
            }

            // Generate auth string for Pusher - this is the format Pusher expects
            $stringToSign = $socketId . ':' . $channelName;
            $signature = hash_hmac('sha256', $stringToSign, $appSecret);
            $authString = $appKey . ':' . $signature;

            Log::info('✅ Manual Pusher auth response created', [
                'channel' => $channelName,
                'socket_id' => $socketId,
                'string_to_sign' => $stringToSign,
                'signature' => $signature,
                'auth_string' => $authString
            ]);

            return response()->json([
                'auth' => $authString
            ]);

        } catch (\Exception $e) {
            Log::error('💥 Manual Pusher auth creation failed', [
                'error' => $e->getMessage(),
                'channel' => $channelName,
                'socket_id' => $socketId
            ]);
            return response()->json(['error' => 'Manual authentication failed: ' . $e->getMessage()], 500);
        }
    }
}