<?php

namespace Modules\Message\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Message\Http\Requests\StoreMessageRequest;
use Modules\Message\Models\Conversation;
use Modules\Message\Models\Message;
use Modules\Message\Models\Attachment;
use Modules\Message\Events\MessageSent;
use Modules\Message\Transformers\MessageResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation)
    {
        $messages = $conversation->messages()->with('attachments')->orderBy('created_at','asc')->get();
        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation)
    {
        $user = $request->user();

        $payload = $request->validated();

        $isStaff = (bool) ($user && property_exists($user, 'is_staff') && $user->is_staff);

        $senderName = $payload['name'] ?? ($user->name ?? 'Unknown');
        $senderContact = $payload['contact'] ?? ($user->email ?? null);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $user ? $user->id : null,
            'sender_name' => $senderName,
            'sender_contact' => $senderContact,
            'is_staff' => $isStaff,
            'body' => $payload['body'] ?? null,
        ]);

        // attachments if present
        if ($request->hasFile('attachments')) {
            $message->has_attachments = true;
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('messages', 'public');
                Attachment::create([
                    'message_id' => $message->id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
            $message->save();
        }

        // update conversation preview
        $conversation->update([
            'last_message_preview' => substr($message->body ?? 'Attachment', 0, 250),
            'last_message_at' => $message->created_at,
        ]);

        event(new MessageSent($message));

        return new MessageResource($message->load('attachments'));
    }

    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        // Only staff can delete messages (enforced via middleware)
        $user = $request->user();
        if (!$user || !property_exists($user, 'is_staff') || !$user->is_staff) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $message->delete();

        return response()->json(['ok' => true]);
    }
}
