<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $employeeId = $this->route('id') ?? $this->route('employee');

        return [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name'  => ['sometimes', 'string', 'max:100'],
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employeeId)],
            'phone'      => ['sometimes', 'string', 'max:30', Rule::unique('employees', 'phone')->ignore($employeeId)],
            'password'   => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'status'     => ['sometimes', 'in:active,inactive'],
            'location'   => ['sometimes', 'nullable', 'string', 'max:150'],
            'full_address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'roles'      => ['sometimes', 'array'],
            'roles.*'    => ['string'],
            'avatar'     => ['sometimes', 'nullable', 'image', 'max:2048'],
        ];
    }
}
