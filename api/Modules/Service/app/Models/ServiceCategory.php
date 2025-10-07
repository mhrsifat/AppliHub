<?php

namespace Modules\Service\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceCategory extends Model
{
    use SoftDeletes;

    protected $fillable = ['name','slug','description','position'];

    public function services()
    {
        return $this->hasMany(Service::class);
    }
}
