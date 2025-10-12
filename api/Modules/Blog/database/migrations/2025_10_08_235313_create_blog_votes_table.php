<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBlogVotesTable extends Migration
{
    public function up()
    {
        Schema::create('blog_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_id')->constrained('blogs')->cascadeOnDelete();
            $table->string('ip_address', 45);
            $table->enum('vote_type', ['up', 'down']);
            $table->timestamps();

            $table->unique(['blog_id', 'ip_address']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('blog_votes');
    }
}
