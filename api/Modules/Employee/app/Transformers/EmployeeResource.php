<?php

namespace Modules\Employee\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class EmployeeResource extends JsonResource
{
    public function toArray($request)
    {
        $avatarUrl = $this->avatar ? Storage::disk('public')->url($this->avatar) : null;

        return [
            'id'         => $this->id,
            'first_name' => $this->first_name,
            'last_name'  => $this->last_name,
            'name'       => trim($this->first_name . ' ' . ($this->last_name ?? '')),
            'email'      => $this->email,
            'phone'      => $this->phone,
            'avatar'     => $avatarUrl,
            'roles'      => $this->whenLoaded('roles') ? $this->roles->pluck('name') : $this->getRoleNames(),
            'status'     => $this->status,
            'created_at' => $this->created_at ? $this->created_at->toDateTimeString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toDateTimeString() : null,
        ];
    }
}