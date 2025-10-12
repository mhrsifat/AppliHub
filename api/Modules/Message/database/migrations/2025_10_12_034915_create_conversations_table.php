<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateConversationsTable extends Migration
{
    public function up()
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->nullable()->unique();
            $table->string('subject')->nullable();
            $table->string('created_by_name');
            $table->string('created_by_contact');
            $table->unsignedBigInteger('assigned_to')->nullable(); // user_id
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('last_message_preview')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('conversations');
    }
}
