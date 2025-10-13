<?php

namespace Modules\Message\Database\Factories;

use Modules\Message\Models\Attachment;
use Modules\Message\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttachmentFactory extends Factory
{
    protected $model = Attachment::class;

    public function definition()
    {
        $filename = $this->faker->lexify('file_????.pdf');

        return [
            'message_id' => Message::factory(),
            'filename' => $filename,
            'path' => 'messages/' . $filename,
            'mime' => 'application/pdf',
            'size' => $this->faker->numberBetween(1000, 200000),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}