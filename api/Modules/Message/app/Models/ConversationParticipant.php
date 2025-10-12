<?php

namespace Modules\Message\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationParticipant extends Model
{
    protected $table = 'message_conversation_participants';

    protected $fillable = ['conversation_id', 'user_id', 'name', 'contact', 'is_staff'];
}
