<?php

namespace Modules\Message\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Message\Http\Requests\StoreConversationRequest;
use Modules\Message\Models\Conversation;
use Modules\Message\Models\Message;
use Modules\Message\Models\ConversationParticipant;
use Modules\Message\Transformers\ConversationResource;
use Modules\Message\Transformers\MessageResource;
use Modules\Message\Events\MessageSent;
use Modules\Message\Events\ConversationStarted;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    // staff: list conversations (paginated)
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $status = $request->get('status', 'open');
        
        $query = Conversation::query()
            ->withCount(['messages as unread_messages_count' => function($q) {
                $q->where('is_read', false)
                  ->where('is_staff', false); // Only count user messages as unread
            }])
            ->orderBy('last_message_at', 'desc');

        // Filter by status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Search filter
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('created_by_name', 'like', "%{$search}%")
                  ->orWhere('created_by_contact', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('last_message_preview', 'like', "%{$search}%");
            });
        }

        return ConversationResource::collection($query->paginate($perPage));
    }

    // public: create conversation + optional first message
    public function store(StoreConversationRequest $request)
    {
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $conversation = Conversation::create([
                'uuid' => (string) Str::uuid(),
                'subject' => $data['subject'] ?? 'New Conversation',
                'created_by_name' => $data['name'],
                'created_by_contact' => $data['contact'],
                'status' => 'open',
            ]);

            // Add participant (anonymous)
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'name' => $data['name'],
                'contact' => $data['contact'],
                'is_staff' => false,
            ]);

            // Create first message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_name' => $data['name'],
                'sender_contact' => $data['contact'],
                'is_staff' => false,
                'body' => $data['message'],
            ]);

            // Update conversation with last message info
            $conversation->update([
                'last_message_preview' => Str::limit($data['message'], 250),
                'last_message_at' => $message->created_at,
            ]);

            DB::commit();

            // Broadcast events
            event(new MessageSent($message));
            event(new ConversationStarted($conversation));

            return new ConversationResource($conversation->load('messages.attachments', 'participants'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create conversation'], 500);
        }
    }

    public function show(Conversation $conversation)
    {
        // Load messages with attachments and order by creation date
        $conversation->load(['messages' => function($query) {
            $query->orderBy('created_at', 'asc')->with('attachments');
        }, 'participants']);

        return new ConversationResource($conversation);
    }

    public function join(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Check if user already joined
        $existingParticipant = ConversationParticipant::where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$existingParticipant) {
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'name' => $user->name,
                'contact' => $user->email,
                'is_staff' => true,
            ]);
        }

        return response()->json(['ok' => true, 'message' => 'Joined conversation successfully']);
    }

    public function assign(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $conversation->update([
            'assigned_to' => $user->id,
            'assigned_at' => now(),
        ]);

        return new ConversationResource($conversation->fresh());
    }

    public function typingStop(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $userName = $user ? $user->name : $request->input('name', 'Guest');
        $isStaff = (bool) $user;

        broadcast(new \Modules\Message\Events\UserTypingStopped(
            $conversation->uuid,
            $userName,
            $isStaff
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }

    public function addNote(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $note = Message::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $user->id,
            'sender_name' => $user->name,
            'body' => $request->body,
            'is_staff' => true,
            'is_internal' => true,
        ]);

        return response()->json([
            'data' => new MessageResource($note),
            'message' => 'Internal note added successfully.'
        ]);
    }

    public function markAsRead(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Mark all non-staff messages as read
        Message::where('conversation_id', $conversation->id)
            ->where('is_staff', false)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true, 'message' => 'Conversation marked as read']);
    }

    public function close(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $conversation->update([
            'status' => 'closed',
            'closed_by' => $user->id,
            'closed_at' => now(),
        ]);

        return response()->json([
            'data' => new ConversationResource($conversation->fresh()),
            'message' => 'Conversation closed successfully.'
        ]);
    }

    public function typing(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $userName = $user ? $user->name : $request->input('name', 'Guest');
        $isStaff = (bool) $user;

        broadcast(new \Modules\Message\Events\UserTyping(
            $conversation->uuid,
            $userName,
            $isStaff
        ))->toOthers();

        return response()->json(['status' => 'ok']);
    }
}