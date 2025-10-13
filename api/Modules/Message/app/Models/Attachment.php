<?php

namespace Modules\Message\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attachment extends Model
{
   use HasFactory;
   
   protected $table = 'message_attachments';

   protected $fillable = ['message_id', 'filename', 'path', 'mime', 'size'];

   public function message(): BelongsTo
   {
       return $this->belongsTo(Message::class, 'message_id');
   }

   public function url()
   {
       return \Storage::disk('public')->url($this->path);
   }

   protected static function newFactory()
   {
       return \Modules\Message\Database\Factories\AttachmentFactory::new();
   }
}