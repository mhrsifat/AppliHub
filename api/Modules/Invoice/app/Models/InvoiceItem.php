<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Invoice\Database\Factories\InvoiceItemFactory::new();
    }

    protected $fillable = [
        'invoice_id','service_id','service_name','description','unit_price','quantity','line_total','meta'
    ];

    protected $casts = [
        'meta' => 'array',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}