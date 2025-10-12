<?php

namespace Modules\Blog\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Blog\Transformers\CommentResource;
use Modules\Blog\Transformers\CategoryResource;
use Modules\Blog\Transformers\TagResource;

class BlogResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'thumbnail' => $this->thumbnail,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'views' => $this->views,
            'upvotes' => $this->upvotes,
            'downvotes' => $this->downvotes,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
