<?php

namespace Modules\Order\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $table = 'orders';

    protected static function newFactory()
    {
        return \Modules\Order\Database\Factories\OrderFactory::new();
    }

    protected $fillable = [
        'order_number',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_address',
        'total',
        'vat_percent',
        'vat_amount',
        'coupon_code',
        'coupon_discount',
        'grand_total',
        'payment_status',
        'status',
        'created_by',
        'updated_by',
    ];
    
    protected $attributes = [
    'status' => 'pending',
    'payment_status' => 'unpaid',
];

    protected static function booted()
    {
        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = static::generateUniqueOrderNumber();
            }
            // ensure numeric fields are normalized
            $order->total = $order->total ?? 0;
            $order->vat_percent = $order->vat_percent ?? 0;
            $order->vat_amount = $order->vat_amount ?? 0;
            $order->coupon_discount = $order->coupon_discount ?? 0;
            $order->grand_total = $order->grand_total ?? 0;
        });

        static::saving(function ($order) {
            // Recalculate totals when saving (guarded: items may be not loaded)
            if ($order->relationLoaded('items')) {
                $order->total = $order->items->sum('total_price');
                $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
                $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
            }
        });
    }

    public static function generateUniqueOrderNumber(): string
    {
        // loop until unique produced (should be fast: 000000-999999)
        do {
            $number = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::where('order_number', $number)->exists());

        return $number;
    }

    // Relationships
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
    
public function assignedTo()
{
    return $this->belongsTo(\App\Models\User::class, 'assigned_to');
}

    // placeholder for invoices relation (Invoices module will define Invoice model)
    public function invoices()
    {
        return $this->hasMany(\Modules\Invoice\Models\Invoice::class, 'order_id');
    }
}