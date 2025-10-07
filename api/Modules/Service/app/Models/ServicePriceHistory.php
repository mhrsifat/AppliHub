<?php

namespace Modules\Service\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePriceHistory extends Model
{
    protected $fillable = ['service_id','old_price','new_price','changed_by_type','changed_by_id','note'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function changedBy()
    {
        return $this->morphTo();
    }
}
