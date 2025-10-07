<?php

namespace Modules\Order\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize()
    {
        // allow updates — restrict in policies in real app
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
            'coupon_discount' => ['nullable','numeric','min:0'],
            'status' => ['nullable','in:draft,confirmed,completed,cancelled'],
            'payment_status' => ['nullable','in:pending,partial,paid,refunded'],
        ];
    }
}