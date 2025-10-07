<?php

namespace Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize()
    {
        return true; // hook policy or gate here
    }

    public function rules()
    {
        return [
            'order_id' => ['required','exists:orders,id'],
            'type' => ['nullable','in:initial,additional,refund'],
            'vat_percent' => ['nullable','numeric','min:0'],
            'coupon_discount' => ['nullable','numeric','min:0'],
            'items' => ['required','array','min:1'],
            'items.*.service_name' => ['required','string'],
            'items.*.unit_price' => ['required','numeric','min:0'],
            'items.*.quantity' => ['required','integer','min:1'],
            'invoice_number' => ['nullable','string'], // or auto generated
        ];
    }
}