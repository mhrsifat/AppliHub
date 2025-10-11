<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Invoice\Database\Factories\InvoiceFactory::new();
    }

    protected $fillable = [
        'order_id','invoice_number','type','subtotal','vat_percent','vat_amount', 'paid_amount','coupon_discount','grand_total','status','meta'
    ];

    protected $casts = [
        'meta' => 'array',
        'subtotal' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'vat_percent' => 'decimal:2',
    ];

    // relationships
    public function order()
    {
        return $this->belongsTo(\Modules\Order\Models\Order::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    // computed attributes
    public function getPaidAmountAttribute()
    {
        return $this->payments()->where('status','completed')->sum('amount');
    }

    public function getBalanceAttribute()
    {
        return max(0, $this->grand_total - $this->paid_amount);
    }
}