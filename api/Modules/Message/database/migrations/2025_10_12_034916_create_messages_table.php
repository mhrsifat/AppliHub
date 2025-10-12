<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagesTable extends Migration
{
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('conversation_id')->index();
            $table->unsignedBigInteger('sender_user_id')->nullable();
            $table->string('sender_name');
            $table->string('sender_contact')->nullable();
            $table->boolean('is_staff')->default(false);
            $table->text('body')->nullable();
            $table->boolean('has_attachments')->default(false);
            $table->timestamps();

            $table->foreign('conversation_id')
                ->references('id')->on('conversations')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('messages');
    }
}
