<?php

namespace Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'amount' => ['required','numeric','gt:0'],
            'method' => ['nullable','in:cash,card,bank_transfer,online,adjustment,other'],
            'payment_reference' => ['nullable','string'],
            'staff_id' => ['nullable','exists:users,id'],
        ];
    }
}