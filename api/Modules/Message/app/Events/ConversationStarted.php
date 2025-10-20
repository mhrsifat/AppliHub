<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Message\Models\Conversation;

class ConversationStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversation;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
    }

    public function broadcastOn()
    {
        // Broadcast to staff channel for new conversations
        return new Channel('conversations');
    }

    public function broadcastAs()
    {
        return 'conversation.started';
    }

    public function broadcastWith()
    {
        return [
            'conversation' => [
                'uuid' => $this->conversation->uuid,
                'subject' => $this->conversation->subject,
                'created_by_name' => $this->conversation->created_by_name,
                'created_by_contact' => $this->conversation->created_by_contact,
                'last_message_preview' => $this->conversation->last_message_preview,
                'last_message_at' => $this->conversation->last_message_at,
                'status' => $this->conversation->status,
                'created_at' => $this->conversation->created_at,
            ]
        ];
    }
}