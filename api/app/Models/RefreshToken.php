<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class RefreshToken extends Model
{
    protected $fillable = [
        'tokenable_id', 'tokenable_type', 'token', 'device_name', 'expires_at', 'revoked_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public $timestamps = true;

    // polymorphic relation (morphTo)
    public function tokenable()
    {
        return $this->morphTo();
    }

    // backwards helper if needed
    public function user()
    {
        if ($this->tokenable_type === \App\Models\User::class) {
            return $this->belongsTo(\App\Models\User::class, 'tokenable_id');
        }
        return null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at ? $this->expires_at->isPast() : false;
    }

    public function isRevoked(): bool
    {
        return !is_null($this->revoked_at);
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);
    }

    public function scopeValid(Builder $query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        })->whereNull('revoked_at');
    }
}