<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize()
    {
        return true; // adjust authorization as needed
    }

    public function rules()
    {
        return [
            'customer_id' => 'nullable|integer',
            'customer_name' => 'required|string|max:191',
            'customer_email' => 'nullable|email|max:191',
            'customer_phone' => 'nullable|string|max:50',
            'customer_address' => 'nullable|string|max:1000',
            'vat_percent' => 'nullable|numeric|min:0',
            'coupon_code' => 'nullable|string|max:100',
            'coupon_discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.service_name' => 'nullable|string|max:191',
            'items.*.service_id' => 'nullable|integer',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'nullable|integer|min:1',
        ];
    }
}
