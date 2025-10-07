<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class RefreshToken extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'token', 'device_name', 'expires_at', 'revoked_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    // ----------------------------
    // Relationships
    // ----------------------------
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ----------------------------
    // Helpers
    // ----------------------------
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isRevoked(): bool
    {
        return !is_null($this->revoked_at);
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);
    }

    // ----------------------------
    // Scopes
    // ----------------------------
    public function scopeValid($query)
    {
        return $query
            ->where('expires_at', '>', now())
            ->whereNull('revoked_at');
    }
}