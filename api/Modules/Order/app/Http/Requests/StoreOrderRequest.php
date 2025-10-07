<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize()
    {
        // adjust authorization as you like
        return true;
    }

    public function rules()
    {
        return [
            'customer_id' => ['nullable','integer','exists:customers,id'],
            'guest_name' => ['nullable','string','max:255'],
            'guest_email' => ['nullable','email','max:255'],
            'vat_percent' => ['nullable','numeric','between:0,100'],
            'coupon_code' => ['nullable','string','max:100'],
            'items' => ['required','array','min:1'],
            'items.*.service_id' => ['nullable','integer'],
            'items.*.service_name' => ['required','string'],
            'items.*.unit_price' => ['required','numeric','min:0'],
            'items.*.quantity' => ['required','integer','min:1'],
        ];
    }
}