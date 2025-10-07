<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoiceItemsTable extends Migration
{
    public function up()
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');

            // if you keep service catalog, link to services table. If not, store name/description.
            $table->unsignedBigInteger('service_id')->nullable(); // optional FK to services table
            $table->string('service_name');
            $table->text('description')->nullable();

            $table->decimal('unit_price', 12, 2);
            $table->integer('quantity')->default(1);
            $table->decimal('line_total', 12, 2);

            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index('invoice_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoice_items');
    }
}