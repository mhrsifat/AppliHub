<?php

namespace Modules\Message\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $table = 'message_conversations';

    protected $fillable = [
        'uuid', 'subject',
        'created_by_name', 'created_by_contact',
        'assigned_to', 'status',
        'last_message_preview', 'last_message_at',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id')->orderBy('created_at', 'asc');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class, 'conversation_id');
    }

    protected static function newFactory()
    {
        return \Modules\Message\Database\Factories\ConversationFactory::new();
    }
}