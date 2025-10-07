<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderItemsTable extends Migration
{
    public function up()
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('order_id')->index();
            // service catalog relation optional - allow nullable
            $table->unsignedBigInteger('service_id')->nullable()->index();
            $table->string('service_name'); // snapshot of name at time of order
            $table->text('service_description')->nullable();

            $table->decimal('unit_price', 14, 2)->default(0);
            $table->integer('quantity')->default(1);
            $table->decimal('total_price', 14, 2)->default(0); // unit_price * quantity (snapshot)

            $table->unsignedBigInteger('added_by')->nullable(); // staff who added this item
            $table->timestamps();

            //$table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            //$table->foreign('service_id')->references('id')->on('services')->nullOnDelete();

            //$table->foreign('added_by')->references('id')->on('users')->cascadeOnDelete()->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('order_items');
    }
}