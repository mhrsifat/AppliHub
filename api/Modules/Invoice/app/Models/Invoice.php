<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Invoice\Models\InvoiceFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'order_id',
        'invoice_number',
        'type',
        'subtotal',
        'vat_percent',
        'vat_amount',
        'coupon_discount',
        'grand_total',
        'status',
        'meta',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'vat_percent' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'coupon_discount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'meta' => 'array',
    ];

    protected $appends = ['paid_amount'];

    /**
     * Accessor: Calculate paid amount from completed payments
     */
    public function getPaidAmountAttribute(): float
    {
        // Use the relationship to sum completed payments
        return (float) $this->payments()
            ->where('status', 'completed')
            ->sum('amount');
    }

    /**
     * Calculate due amount
     */
    public function getDueAmountAttribute(): float
    {
        $paid = $this->paid_amount;
        $total = (float) $this->grand_total;
        return max(0, $total - $paid);
    }

    /**
     * Relationships
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(\Modules\Order\Models\Order::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * Boot method to auto-generate invoice number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            if (empty($invoice->invoice_number)) {
                $invoice->invoice_number = 'INV-' . strtoupper(\Illuminate\Support\Str::random(8));
            }
        });
    }

    /**
     * Return a new factory instance for the model (module-local factory)
     */
    protected static function newFactory(): \Illuminate\Database\Eloquent\Factories\Factory
    {
        return InvoiceFactory::new();
    }
}
