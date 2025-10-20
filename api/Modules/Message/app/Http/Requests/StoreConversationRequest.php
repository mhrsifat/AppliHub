<?php

namespace Modules\Message\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Allow anonymous users
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'contact' => 'required|string|max:255',
            'message' => 'required|string|min:1|max:5000',
            'subject' => 'nullable|string|max:255',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Please provide your name',
            'contact.required' => 'Please provide your email or phone number',
            'message.required' => 'Please enter your message',
        ];
    }
}