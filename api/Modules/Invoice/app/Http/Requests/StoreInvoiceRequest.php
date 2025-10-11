<?php

namespace Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'order_id' => 'nullable|integer|exists:orders,id',
            'invoice_number' => 'nullable|string|max:191',
            'vat_percent' => 'nullable|numeric|min:0',
            'coupon_discount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.service_name' => 'required|string|max:191',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }
}