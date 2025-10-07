<?php

namespace Modules\Order\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'service_id' => $this->service_id,
            'service_name' => $this->service_name,
            'service_description' => $this->service_description,
            'unit_price' => (float) $this->unit_price,
            'quantity' => (int) $this->quantity,
            'total_price' => (float) $this->total_price,
            'added_by' => $this->added_by,
            'created_at' => $this->created_at,
        ];
    }
}