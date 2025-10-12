<?php

namespace Modules\Blog\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CommentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'blog_id' => 'required|exists:blogs,id',
            'parent_id' => 'nullable|exists:comments,id',
            'user_name' => 'nullable|string|max:255',
            'comment_text' => 'required|string|max:2000',
        ];
    }
}
