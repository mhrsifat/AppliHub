<?php

namespace Modules\Order\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'guest_name' => $this->guest_name,
            'guest_email' => $this->guest_email,
            'total' => (float) $this->total,
            'vat_percent' => (float) $this->vat_percent,
            'vat_amount' => (float) $this->vat_amount,
            'coupon_code' => $this->coupon_code,
            'coupon_discount' => (float) $this->coupon_discount,
            'grand_total' => (float) $this->grand_total,
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}