<?php

namespace Modules\Message\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversationUuid;
    public $userName;
    public $isStaff;

    /**
     * Create a new event instance.
     */
    public function __construct(string $conversationUuid, string $userName, bool $isStaff = false)
    {
        $this->conversationUuid = $conversationUuid;
        $this->userName = $userName;
        $this->isStaff = $isStaff;
        
        \Log::info('UserTyping Event Created', [
            'conversation_uuid' => $conversationUuid,
            'user_name' => $userName,
            'is_staff' => $isStaff,
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channelName = 'conversation.' . $this->conversationUuid;
        
        \Log::info('Broadcasting UserTyping on channel: ' . $channelName);
        
        return [
            new Channel($channelName),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'UserTyping';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'conversationUuid' => $this->conversationUuid,
            'userName' => $this->userName,
            'isStaff' => $this->isStaff,
        ];
    }
}