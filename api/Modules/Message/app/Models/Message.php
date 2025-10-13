<?php

namespace Modules\Message\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $table = 'message_messages';

    protected $fillable = [
        'conversation_id',
        'sender_user_id', 'sender_name', 'sender_contact', 'is_staff',
        'body', 'has_attachments'
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'message_id');
    }

    protected static function newFactory()
    {
        return \Modules\Message\Database\Factories\MessageFactory::new();
    }
}