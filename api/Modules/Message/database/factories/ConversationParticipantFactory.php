<?php

namespace Modules\Message\Database\Factories;

use Modules\Message\Models\ConversationParticipant;
use Modules\Message\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationParticipantFactory extends Factory
{
    protected $model = ConversationParticipant::class;

    public function definition()
    {
        return [
            'conversation_id' => Conversation::factory(),
            'user_id' => null,
            'name' => $this->faker->name(),
            'contact' => $this->faker->safeEmail(),
            'is_staff' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}