<?php

namespace Modules\Service\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected static function newFactory()
    {
        return \Modules\Service\Database\Factories\ServiceFactory::new();
    }

    protected $fillable = [
        'title',
        'slug',
        'sku',
        'service_category_id',
        'description',
        'icon',
        'price',
        'price_includes_vat',
        'vat_applicable',
        'vat_percent',
        'is_active',
        'stock',
        'meta'
    ];

    protected $casts = [
        'meta' => 'array',
        'price_includes_vat' => 'boolean',
        'vat_applicable' => 'boolean',
        'is_active' => 'boolean',
        'vat_percent' => 'float',
        'price' => 'float',
    ];

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function addons()
    {
        return $this->hasMany(ServiceAddon::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(ServicePriceHistory::class);
    }

    public function orders()
    {
        return $this->belongsToMany(\Modules\Order\Models\Order::class, 'order_service')
            ->withPivot(['unit_price', 'quantity', 'vat_percent', 'vat_amount', 'line_total', 'addons'])
            ->withTimestamps();
    }

    public function invoices()
    {
        return $this->belongsToMany(\Modules\Invoice\Models\Invoice::class, 'invoice_service')
            ->withPivot(['unit_price', 'quantity', 'vat_percent', 'vat_amount', 'line_total', 'addons'])
            ->withTimestamps();
    }
}
