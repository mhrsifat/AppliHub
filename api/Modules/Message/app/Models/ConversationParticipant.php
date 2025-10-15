<?php

namespace Modules\Message\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $table = 'message_conversation_participants';

    protected $fillable = ['conversation_id', 'user_id', 'name', 'contact', 'is_staff'];

    protected static function newFactory()
    {
        return \Modules\Message\Database\Factories\ConversationParticipantFactory::new();
    }
}