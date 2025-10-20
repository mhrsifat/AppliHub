<?php

namespace Modules\Message\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Allow both authenticated and anonymous users
    }

    public function rules()
    {
        return [
            'body' => 'required_without:attachments|string|max:5000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB max per file
            'name' => 'sometimes|string|max:255', // For anonymous users
            'contact' => 'sometimes|string|max:255', // For anonymous users
        ];
    }

    public function messages()
    {
        return [
            'body.required_without' => 'Please enter a message or attach a file',
            'attachments.*.max' => 'File size must be less than 10MB',
        ];
    }
}