<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderItemRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'service_id' => ['nullable','integer'],
            'service_name' => ['required','string','max:255'],
            'service_description' => ['nullable','string'],
            'unit_price' => ['required','numeric','min:0'],
            'quantity' => ['required','integer','min:1'],
        ];
    }
}