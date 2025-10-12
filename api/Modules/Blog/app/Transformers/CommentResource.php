<?php

namespace Modules\Blog\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'user_name' => $this->user_name,
            'comment_text' => $this->comment_text,
            'ip_address' => $this->ip_address,
            'is_admin_reply' => (bool) $this->is_admin_reply,
            'created_at' => $this->created_at,
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
