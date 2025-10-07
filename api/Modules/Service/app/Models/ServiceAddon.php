<?php

namespace Modules\Service\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceAddon extends Model
{
    use SoftDeletes;

    protected $fillable = ['service_id','title','sku','price','vat_applicable','vat_percent','description','is_active'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
