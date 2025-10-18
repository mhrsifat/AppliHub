<?php

namespace Modules\Employee\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Employee extends Authenticatable
{
    use HasFactory, SoftDeletes, HasRoles, HasApiTokens, Notifiable;

    protected $guard_name = 'sanctum';

    protected $table = 'employees';

    protected static function newFactory()
    {
        return \Modules\Employee\Database\Factories\EmployeeFactory::new();
    }

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'avatar',
        'status',
        'location',
        'full_address',
        // add other columns as needed
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getAvatarAttribute($value)
{
    if (! $value) {
        return null;
    }

    // Always absolute https:// URL
    $url = asset('storage/' . ltrim($value, '/'));
    return str_replace('http://', 'https://', $url);
}
}
