<?php

namespace Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RefundRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'amount' => ['required','numeric','gt:0'],
            'reason' => ['required','string'],
            'invoice_payment_id' => ['nullable','exists:invoice_payments,id'],
            'staff_id' => ['nullable','exists:users,id'],
        ];
    }
}