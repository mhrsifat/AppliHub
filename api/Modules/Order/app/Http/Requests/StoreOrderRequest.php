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
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'numeric', 'max:255'],
            'customer_address' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'vat_percent' => ['nullable', 'numeric', 'between:0,100'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            // items are optional; if provided they must be a non-empty array
            'items' => ['nullable', 'array'],
            'items.*.service_id' => ['nullable', 'integer'],
            'items.*.service_name' => ['required_with:items', 'string'],
            'items.*.service_description' => ['nullable', 'string'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
        ];
    }

    /**
     * Map frontend-friendly fields (description, price) into the names
     * expected by the backend (service_name, unit_price) so clients can
     * send either shape.
     */
    protected function prepareForValidation()
    {
        $items = $this->get('items', null);
        if (!is_array($items)) {
            return;
        }

        $normalized = [];
        foreach ($items as $it) {
            $normalized[] = [
                'service_id' => $it['service_id'] ?? null,
                'service_name' => $it['service_name'] ?? ($it['description'] ?? null),
                'service_description' => $it['service_description'] ?? ($it['description'] ?? null),
                'unit_price' => $it['unit_price'] ?? ($it['price'] ?? null),
                'quantity' => $it['quantity'] ?? 1,
            ];
        }

        $this->merge(['items' => $normalized]);
    }
}
