<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServicePriceHistoriesTable extends Migration
{
    public function up()
    {
        Schema::create('service_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->decimal('old_price', 14, 2);
            $table->decimal('new_price', 14, 2);
            $table->string('changed_by_type')->nullable();
            $table->unsignedBigInteger('changed_by_id')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::table('service_price_histories', function (Blueprint $table) {
            $table->index(['service_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_price_histories');
    }
}
