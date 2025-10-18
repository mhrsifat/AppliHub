<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateConversationsTable extends Migration
{
    public function up()
    {
        Schema::create('message_conversations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->nullable()->unique();
            $table->string('subject')->nullable();
            $table->string('created_by_name')->nullable();
            $table->string('created_by_contact')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable(); 
            $table->unsignedBigInteger('closed_by')->nullable(); 
            $table->enum('status', ['open', 'pending',  'closed'])->default('open');
            $table->text('last_message_preview')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('message_conversations');
    }
}
