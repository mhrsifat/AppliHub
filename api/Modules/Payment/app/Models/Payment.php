<?php
namespace Modules\Payment\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $guarded = [];
    protected $casts = ['raw_response' => 'array'];

    public function invoice()
    {
        return $this->belongsTo(\Modules\Invoice\Models\Invoice::class);
    }

    public function order()
    {
        return $this->belongsTo(\Modules\Order\Models\Order::class);
    }
}