<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize()
    {
        // we use controller middleware too; keep this true for centralization
        return true;
    }

    public function rules()
    {
        return [
            'first_name' => ['required','string','max:100'],
            'last_name'  => ['nullable','string','max:100'],
            'email'      => ['required','email','max:255','unique:employees,email'],
            'phone'      => ['nullable','string','max:30','unique:employees,phone'],
            'password'   => ['required','string','min:8','confirmed'],
            'status'     => ['nullable','in:active,inactive'],
            'roles'      => ['nullable','array'],
            'roles.*'    => ['string'],
            'avatar'     => ['nullable','image','max:2048'],
        ];
    }
}