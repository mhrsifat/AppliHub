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
            'service_id' => 'nullable|integer',
            'service_name' => 'required_without:service_id|string|max:191',
            'service_description' => 'nullable|string|max:1000',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
        ];
    }
}