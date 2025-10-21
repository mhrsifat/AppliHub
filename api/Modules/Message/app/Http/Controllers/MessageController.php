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
use Illuminate\Support\Str;

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

        // Fetch staff roles from config so you can extend easily later.
        $staffRoles = config('message.staff_roles', ['admin','employee','manager']);

        // Use Spatie hasAnyRole if available. Fallback to false.
        $isStaff = false;
        if ($user) {
            if (method_exists($user, 'hasAnyRole')) {
                $isStaff = (bool) $user->hasAnyRole($staffRoles);
            } else {
                // In case you don't use Spatie, optionally check a column 'role' or 'is_staff' if exists
                $isStaff = (bool) ($user->is_staff ?? false);
            }
        }

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

        // attachments if present (support single or multiple)
        if ($request->hasFile('attachments')) {
            $files = $request->file('attachments');
            // If single file sent without array key - normalize to array
            if (!is_array($files)) {
                $files = [$files];
            }

            $message->has_attachments = true;
            foreach ($files as $file) {
                // store on public disk (ensure php artisan storage:link has been run)
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

        // Load relationships for broadcasting
        $message->load('attachments', 'conversation');

        // Broadcast the message - IMPORTANT: Add this line
        broadcast(new MessageSent($message))->toOthers();

        \Log::info('Message broadcasted', [
            'conversation_uuid' => $conversation->uuid,
            'message_id' => $message->id,
            'channel' => 'conversation.' . $conversation->uuid
        ]);

        return new MessageResource($message->load('attachments'));
    }

    public function destroy(Request $request, $id)
    {
        $message = Message::findOrFail($id);

        $user = $request->user();
        $staffRoles = config('message.staff_roles', ['admin','employee','manager']);

        $isStaff = false;
        if ($user) {
            if (method_exists($user, 'hasAnyRole')) {
                $isStaff = (bool) $user->hasAnyRole($staffRoles);
            } else {
                $isStaff = (bool) ($user->is_staff ?? false);
            }
        }

        if (!$isStaff) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // delete attachments physically (optional)
        foreach ($message->attachments as $att) {
            if ($att->path && Storage::disk('public')->exists($att->path)) {
                Storage::disk('public')->delete($att->path);
            }
            $att->delete();
        }

        $message->delete();

        return response()->json(['ok' => true]);
    }
}