<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
   use SerializesModels;
   
    public $conversationId;
    public $userName;
    public $isStaff;

    public function __construct($conversationId, $userName, $isStaff = false)
    {
        $this->conversationId = $conversationId;
        $this->userName = $userName;
        $this->isStaff = $isStaff;
    }

    public function broadcastOn()
    {
        return new Channel('conversation.' . $this->conversationId);
    }
    public function broadcastAs()
{
    return 'UserTyping';
}
}