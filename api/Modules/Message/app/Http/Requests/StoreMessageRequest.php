<?php

namespace Modules\Message\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules()
    {
        return [
            'name' => 'sometimes|required|string|max:191',
            'contact' => 'sometimes|required|string|max:191',
            'body' => 'nullable|string',
            'attachments.*' => 'nullable|file|max:10240',
        ];
    }
}
