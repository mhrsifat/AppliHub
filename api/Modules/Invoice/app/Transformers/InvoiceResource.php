<?php

namespace Modules\Invoice\Transformers;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'type' => $this->type,
            'status' => $this->status,
            'order_id' => $this->order_id,
            'subtotal' => (float) $this->subtotal,
            'vat_percent' => (float) $this->vat_percent,
            'vat_amount' => (float) $this->vat_amount,
            'coupon_discount' => (float) $this->coupon_discount,
            'grand_total' => (float) $this->grand_total,
            'paid_amount' => (float) $this->paid_amount,
            'balance' => (float) $this->balance,
            'meta' => $this->meta,
            'items' => $this->whenLoaded('items', $this->items->map(function($it){
                return [
                    'id'=>$it->id,
                    'service_id'=>$it->service_id,
                    'service_name'=>$it->service_name,
                    'description'=>$it->description,
                    'unit_price'=> (float)$it->unit_price,
                    'quantity' => (int)$it->quantity,
                    'line_total' => (float)$it->line_total,
                ];
            })),
            'payments' => $this->whenLoaded('payments', $this->payments->map(function($p){
                return [
                    'id' => $p->id,
                    'amount' => (float)$p->amount,
                    'method' => $p->method,
                    'status' => $p->status,
                    'staff_id' => $p->staff_id,
                    'payment_reference' => $p->payment_reference,
                    'created_at' => $p->created_at,
                ];
            })),
            'refunds' => $this->whenLoaded('refunds', $this->refunds->map(function($r){
                return [
                    'id'=>$r->id,
                    'amount' => (float)$r->amount,
                    'status' => $r->status,
                    'reason' => $r->reason,
                    'created_at' => $r->created_at,
                ];
            })),
            'created_at' => $this->created_at,
        ];
    }
}

