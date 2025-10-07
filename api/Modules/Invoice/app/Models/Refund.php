<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id','invoice_payment_id','amount','staff_id','reason','note','status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function payment()
    {
        return $this->belongsTo(InvoicePayment::class, 'invoice_payment_id');
    }
}