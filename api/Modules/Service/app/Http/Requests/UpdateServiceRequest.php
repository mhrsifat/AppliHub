<?php

namespace Modules\Service\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $serviceId = $this->route('service')->id ?? null;
        return [
            'title' => 'sometimes|required|string|max:255',
            'slug' => "nullable|alpha_dash|unique:services,slug,$serviceId",
            'sku' => "nullable|string|max:100|unique:services,sku,$serviceId",
            'service_category_id' => 'nullable|exists:service_categories,id',
            'description' => 'nullable|string',
            'icon' => 'nullable|image|max:2048',
            'icon_delete' => 'sometimes|boolean',
            'price' => 'sometimes|numeric|min:0',
            'vat_applicable' => 'boolean',
            'vat_percent' => 'numeric|min:0',
            'price_includes_vat' => 'boolean',
            'is_active' => 'boolean',
            'stock' => 'nullable|integer|min:0',
            'meta' => 'nullable|array',
        ];
    }
}
