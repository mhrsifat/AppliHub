<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServiceCategoriesTable extends Migration
{
    public function up()
    {
        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_categories');
    }
}
