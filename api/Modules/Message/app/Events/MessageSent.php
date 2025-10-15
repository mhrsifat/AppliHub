<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;
use Modules\Message\Transformers\MessageResource;
use Modules\Message\Models\Message;

class MessageSent implements ShouldBroadcast
{
    use SerializesModels;

    public $message;
    protected $conversationId;

    public function __construct(Message $message)
    {
        $this->message = new MessageResource($message);
        $this->conversationId = $message->conversation_id;
    }

    public function broadcastOn()
    {
        return new Channel('conversation.' . $this->conversationId);
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message,
        ];
    }
    
    public function broadcastAs()
{
    return 'MessageSent';
}
}
