<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoiceServiceTable extends Migration
{
    public function up()
    {
        Schema::create('invoice_service', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('service_id');
            $table->decimal('unit_price', 14, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('vat_percent', 5, 2)->default(0.00);
            $table->decimal('vat_amount', 14, 2)->default(0);
            $table->decimal('line_total', 14, 2)->default(0);
            $table->json('addons')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoice_service');
    }
}
