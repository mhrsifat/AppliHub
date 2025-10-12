<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoicePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'payment_reference',
        'staff_id',
        'amount',
        'method',
        'status',
        'note'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    protected static function booted()
    {
        static::saved(function ($payment) {
            if ($payment->invoice) {
                app(\Modules\Invoice\Services\InvoiceService::class)->recalcAndRefresh($payment->invoice);
            }
        });

        static::deleted(function ($payment) {
            if ($payment->invoice) {
                app(\Modules\Invoice\Services\InvoiceService::class)->recalcAndRefresh($payment->invoice);
            }
        });
    }
}
