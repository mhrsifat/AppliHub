<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'customer_id' => 'nullable|integer',
            'customer_name' => 'nullable|string|max:191',
            'customer_email' => 'nullable|email|max:191',
            'customer_phone' => 'nullable|string|max:50',
            'customer_address' => 'nullable|string|max:1000',
            'vat_percent' => 'nullable|numeric|min:0',
            'coupon_code' => 'nullable|string|max:100',
            'coupon_discount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string',
            'payment_status' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|integer',
        ];
    }
}