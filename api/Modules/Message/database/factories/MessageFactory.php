<?php

namespace Modules\Message\Database\Factories;

use Modules\Message\Models\Message;
use Modules\Message\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition()
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_user_id' => null,
            'sender_name' => $this->faker->name(),
            'sender_contact' => $this->faker->safeEmail(),
            'is_staff' => false,
            'body' => $this->faker->sentences(3, true),
            'has_attachments' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}