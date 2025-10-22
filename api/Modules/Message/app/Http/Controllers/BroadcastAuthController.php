<?php

namespace Modules\Message\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BroadcastAuthController extends Controller
{
    /**
     * Authenticate the request for channel access for authenticated users
     */
    public function authenticate(Request $request)
    {
        try {
            $user = $request->user();

            // Debug: Log the complete request
            Log::info('🔐 Authenticated broadcast auth request - FULL DEBUG', [
                'content_type' => $request->header('Content-Type'),
                'all_input' => $request->all(),
                'query_params' => $request->query(),
                'raw_content' => $request->getContent(),
                'user_id' => $user ? $user->id : 'null'
            ]);

            // Get channel_name and socket_id from proper Pusher format
            // Pusher sends these as form parameters, not JSON
            $channelName = $request->input('channel_name');
            $socketId = $request->input('socket_id');

            // Alternative: try to get from raw content if form parsing fails
            if (!$channelName || !$socketId) {
                parse_str($request->getContent(), $parsedData);
                $channelName = $parsedData['channel_name'] ?? null;
                $socketId = $parsedData['socket_id'] ?? null;
            }

            Log::info('🔐 Extracted Pusher auth parameters', [
                'channel_name' => $channelName,
                'socket_id' => $socketId,
                'method' => 'authenticated'
            ]);

            // Check if user is properly authenticated
            if (!$user) {
                Log::warning('❌ No authenticated user found in broadcast auth');
                return response()->json(['error' => 'Authentication required'], 401);
            }

            // Check if channel_name and socket_id are present
            if (!$channelName || !$socketId) {
                Log::warning('❌ Missing channel_name or socket_id after extraction', [
                    'channel_name' => $channelName,
                    'socket_id' => $socketId,
                    'content_type' => $request->header('Content-Type'),
                    'raw_content' => $request->getContent()
                ]);
                return response()->json(['error' => 'Missing channel_name or socket_id'], 400);
            }

            // Validate channel name format
            if (!preg_match('/^private-conversation\.([a-f0-9-]+)$/', $channelName, $matches)) {
                Log::warning('❌ Invalid channel format for authenticated user', [
                    'channel' => $channelName,
                    'pattern' => 'private-conversation.{uuid}'
                ]);
                return response()->json(['error' => 'Invalid channel format'], 403);
            }

            $conversationUuid = $matches[1];

            // Check if user has access to this conversation
            // You'll need to implement this based on your business logic
            if (!$this->userCanAccessConversation($user, $conversationUuid)) {
                Log::warning('❌ User does not have access to conversation', [
                    'user_id' => $user->id,
                    'conversation_uuid' => $conversationUuid
                ]);
                return response()->json(['error' => 'Access denied'], 403);
            }

            Log::info('✅ Authenticated user authorized for channel', [
                'conversation_uuid' => $conversationUuid,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_type' => $this->getUserType($user)
            ]);

            return $this->createPusherAuthResponse($channelName, $socketId);

        } catch (\Exception $e) {
            Log::error('💥 Authenticated broadcast auth error', [
                'error' => $e->getMessage(),
                'channel' => $channelName ?? 'unknown',
                'user_id' => $request->user() ? $request->user()->id : 'null',
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 403);
        }
    }

    /**
     * Authenticate the request for channel access for anonymous users
     */
    public function authenticateAnonymous(Request $request)
    {
        try {
            // Debug: Log the complete request
            Log::info('🔐 Anonymous broadcast auth request - FULL DEBUG', [
                'content_type' => $request->header('Content-Type'),
                'all_input' => $request->all(),
                'query_params' => $request->query(),
                'raw_content' => $request->getContent()
            ]);

            // Get channel_name and socket_id from proper Pusher format
            $channelName = $request->input('channel_name');
            $socketId = $request->input('socket_id');

            // Alternative: try to get from raw content if form parsing fails
            if (!$channelName || !$socketId) {
                parse_str($request->getContent(), $parsedData);
                $channelName = $parsedData['channel_name'] ?? null;
                $socketId = $parsedData['socket_id'] ?? null;
            }

            Log::info('🔐 Extracted Pusher auth parameters', [
                'channel_name' => $channelName,
                'socket_id' => $socketId,
                'method' => 'anonymous'
            ]);

            // Check if channel_name and socket_id are present
            if (!$channelName || !$socketId) {
                Log::warning('❌ Missing channel_name or socket_id for anonymous auth', [
                    'channel_name' => $channelName,
                    'socket_id' => $socketId,
                    'content_type' => $request->header('Content-Type')
                ]);
                return response()->json(['error' => 'Missing channel_name or socket_id'], 400);
            }

            // Validate channel name format
            if (!preg_match('/^private-conversation\.([a-f0-9-]+)$/', $channelName, $matches)) {
                Log::warning('❌ Invalid channel format for anonymous user', [
                    'channel' => $channelName,
                    'pattern' => 'private-conversation.{uuid}'
                ]);
                return response()->json(['error' => 'Invalid channel format'], 403);
            }

            $conversationUuid = $matches[1];

            // For anonymous users, get contact info from request
            $contact = $request->input('contact');

            if (!$contact) {
                Log::warning('❌ No contact provided for anonymous auth');
                return response()->json(['error' => 'Contact information required'], 403);
            }

            // Verify anonymous user has access to this conversation
            if (!$this->anonymousCanAccessConversation($contact, $conversationUuid)) {
                Log::warning('❌ Anonymous user does not have access to conversation', [
                    'contact' => $contact,
                    'conversation_uuid' => $conversationUuid
                ]);
                return response()->json(['error' => 'Access denied'], 403);
            }

            Log::info('✅ Anonymous user authorized for channel', [
                'conversation_uuid' => $conversationUuid,
                'contact' => $contact
            ]);

            return $this->createPusherAuthResponse($channelName, $socketId);

        } catch (\Exception $e) {
            Log::error('💥 Anonymous broadcast auth error', [
                'error' => $e->getMessage(),
                'channel' => $channelName ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Authentication failed: ' . $e->getMessage()], 403);
        }
    }

    /**
     * Check if authenticated user can access the conversation
     */
    protected function userCanAccessConversation($user, $conversationUuid)
    {
        // TODO: Implement your business logic here
        // Example: Check if user is participant in conversation
        // For now, allow all access - implement proper authorization
        
        Log::info('🔍 Checking user access to conversation', [
            'user_id' => $user->id,
            'conversation_uuid' => $conversationUuid
        ]);
        
        return true; // Temporary - implement proper checks
    }

    /**
     * Check if anonymous user can access the conversation
     */
    protected function anonymousCanAccessConversation($contact, $conversationUuid)
    {
        // TODO: Implement your business logic here
        // Example: Check if contact is the creator of the conversation
        // For now, allow all access - implement proper authorization
        
        Log::info('🔍 Checking anonymous access to conversation', [
            'contact' => $contact,
            'conversation_uuid' => $conversationUuid
        ]);
        
        return true; // Temporary - implement proper checks
    }

    /**
     * Manual Pusher auth response
     */
    protected function createPusherAuthResponse($channelName, $socketId)
    {
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

            // Generate auth string for Pusher
            $stringToSign = $socketId . ':' . $channelName;
            $signature = hash_hmac('sha256', $stringToSign, $appSecret);
            $authString = $appKey . ':' . $signature;

            Log::info('✅ Manual Pusher auth response created', [
                'channel' => $channelName,
                'socket_id' => $socketId,
                'string_to_sign' => $stringToSign,
                'signature_length' => strlen($signature)
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

    /**
     * Determine user type for logging
     */
    protected function getUserType($user)
    {
        if (!$user) return 'none';
        
        if (isset($user->is_admin) && $user->is_admin) return 'admin';
        if (isset($user->is_staff) && $user->is_staff) return 'staff';
        if (isset($user->is_employee) && $user->is_employee) return 'employee';
        
        return 'user';
    }
}