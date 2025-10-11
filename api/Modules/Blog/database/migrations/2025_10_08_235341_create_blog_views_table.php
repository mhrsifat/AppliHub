<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBlogViewsTable extends Migration
{
    public function up()
    {
        Schema::create('blog_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_id')->constrained('blogs')->cascadeOnDelete();
            $table->string('ip_address', 45);
            $table->timestamps();

            $table->index(['blog_id', 'ip_address']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('blog_views');
    }
}
