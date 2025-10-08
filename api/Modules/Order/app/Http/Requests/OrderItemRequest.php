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
            'service_id' => ['nullable', 'integer'],
            'service_name' => ['required', 'string', 'max:255'],
            'service_description' => ['nullable', 'string'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation()
    {
        // support clients that send `description` and `price` keys
        $data = $this->all();
        if (isset($data['description']) && !isset($data['service_name'])) {
            $data['service_name'] = $data['description'];
        }
        if (isset($data['price']) && !isset($data['unit_price'])) {
            $data['unit_price'] = $data['price'];
        }

        $this->replace($data);
    }
}
