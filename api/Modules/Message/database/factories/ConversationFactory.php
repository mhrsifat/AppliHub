<?php

namespace Modules\Message\Database\Factories;

use Modules\Message\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition()
    {
        return [
            'uuid' => (string) Str::uuid(),
            'subject' => $this->faker->sentence(),
            'created_by_name' => $this->faker->name(),
            'created_by_contact' => $this->faker->safeEmail(),
            'assigned_to' => null,
            'status' => 'open',
            'last_message_preview' => $this->faker->text(100),
            'last_message_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}