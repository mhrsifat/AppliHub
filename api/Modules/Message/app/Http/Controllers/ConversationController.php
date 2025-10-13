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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ConversationController extends Controller
{
    // employee: list conversations (paginated)
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $query = Conversation::query()->orderBy('last_message_at', 'desc');

        return ConversationResource::collection($query->paginate($perPage));
    }

    // public: create conversation + optional first message
    public function store(StoreConversationRequest $request)
    {
        $data = $request->validated();
        
        $data['name'] = $data['name'] ?? "Anonimus User";

        $conversation = Conversation::create([
            'uuid' => (string) Str::uuid(),
            'subject' => $data['subject'] ?? null,
            'created_by_name' => $data['name'],
            'created_by_contact' => $data['contact'],
        ]);

        // add participant (anonymous)
        ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'name' => $data['name'],
            'contact' => $data['contact'],
            'is_staff' => false,
        ]);

        if (!empty($data['message'])) {
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_name' => $data['name'],
                'sender_contact' => $data['contact'],
                'is_staff' => false,
                'body' => $data['message'],
            ]);

            $conversation->update([
                'last_message_preview' => Str::limit($data['message'], 250),
                'last_message_at' => $message->created_at,
            ]);

            event(new MessageSent($message));
        }

        return new ConversationResource($conversation);
    }

    public function show(Conversation $conversation)
    {
        return new ConversationResource($conversation->load('messages.attachments', 'participants'));
    }

    public function join(Request $request, Conversation $conversation)
    {
        // for staff -> add staff participant
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        ConversationParticipant::firstOrCreate([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ], [
            'name' => $user->name ?? null,
            'contact' => $user->email ?? null,
            'is_staff' => true,
        ]);

        return response()->json(['ok' => true]);
    }

    public function assign(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        $conversation->assigned_to = $user ? $user->id : null;
        $conversation->save();

        return new ConversationResource($conversation);
    }
}
