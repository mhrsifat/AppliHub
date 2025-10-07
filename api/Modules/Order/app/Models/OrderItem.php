<?php

namespace Modules\Order\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected static function newFactory()
    {
        return \Modules\Order\Database\Factories\OrderItemFactory::new();
    }

    protected $fillable = [
        'order_id',
        'service_id',
        'service_name',
        'service_description',
        'unit_price',
        'quantity',
        'total_price',
        'added_by',
    ];

    protected static function booted()
    {
        static::creating(function ($item) {
            $item->total_price = round(($item->unit_price * $item->quantity), 2);
        });

        static::saving(function ($item) {
            $item->total_price = round(($item->unit_price * $item->quantity), 2);
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function service()
    {
        return $this->belongsTo(\Modules\Service\Models\Service::class, 'service_id'); // optional
    }
}