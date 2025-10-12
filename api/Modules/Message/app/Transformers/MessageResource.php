<?php

namespace Modules\Message\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_user_id' => $this->sender_user_id,
            'sender_name' => $this->sender_name,
            'sender_contact' => $this->sender_contact,
            'is_staff' => (bool) $this->is_staff,
            'body' => $this->body,
            'attachments' => $this->attachments->map(function($a) {
                return [
                    'id' => $a->id,
                    'filename' => $a->filename,
                    'url' => $a->url(),
                    'mime' => $a->mime,
                    'size' => $a->size,
                ];
            }),
            'created_at' => $this->created_at,
        ];
    }
}
