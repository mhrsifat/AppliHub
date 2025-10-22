<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversationUuid;
    public $userName;
    public $isStaff;

    public function __construct($conversationUuid, $userName, $isStaff = false)
    {
        $this->conversationUuid = $conversationUuid;
        $this->userName = $userName;
        $this->isStaff = $isStaff;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('conversation.' . $this->conversationUuid);
    }

    public function broadcastAs()
    {
        return 'UserTyping';
    }

    public function broadcastWith()
    {
        return [
            'user_name' => $this->userName,
            'conversation_uuid' => $this->conversationUuid,
            'is_staff' => $this->isStaff,
        ];
    }
}