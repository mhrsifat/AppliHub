<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Message\Models\Message;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        // Broadcast to the specific conversation channel
        return new Channel('conversation.' . $this->message->conversation->uuid);
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }

    public function broadcastWith()
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_name' => $this->message->sender_name,
                'sender_contact' => $this->message->sender_contact,
                'is_staff' => $this->message->is_staff,
                'is_internal' => $this->message->is_internal,
                'body' => $this->message->body,
                'has_attachments' => $this->message->has_attachments,
                'attachments' => $this->message->attachments->map(function($attachment) {
                    return [
                        'id' => $attachment->id,
                        'filename' => $attachment->filename,
                        'url' => storage_url($attachment->path),
                        'mime' => $attachment->mime,
                        'size' => $attachment->size,
                    ];
                }),
                'created_at' => $this->message->created_at->toISOString(),
                'updated_at' => $this->message->updated_at->toISOString(),
            ]
        ];
    }
}