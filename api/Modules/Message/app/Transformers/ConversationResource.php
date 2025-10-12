<?php

namespace Modules\Message\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'subject' => $this->subject,
            'created_by_name' => $this->created_by_name,
            'created_by_contact' => $this->created_by_contact,
            'assigned_to' => $this->assigned_to,
            'status' => $this->status,
            'last_message_preview' => $this->last_message_preview,
            'last_message_at' => $this->last_message_at,
            'messages_count' => $this->messages()->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
