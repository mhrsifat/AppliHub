<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoicesTable extends Migration
{
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            // Link to orders table (an order can have multiple invoices)
            $table->unsignedBigInteger('order_id');

            // invoice reference/type
            $table->string('invoice_number')->unique(); // you can generate a formatted invoice number
            $table->enum('type', ['initial', 'additional', 'refund', 'standard'])->default('initial');

            // monetary fields
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('vat_percent', 5, 2)->default(0);
            $table->decimal('vat_amount', 12, 2)->default(0);
            $table->decimal('coupon_discount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);

            // status of this invoice (draft, issued, paid, partially_paid, refunded, cancelled)
            $table->enum('status', [
                'draft',
                'issued',
                'unpaid',
                'partially_paid',
                'paid',
                'refunded',
                'cancelled'
            ])->default('draft');


            // metadata
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'invoice_number']);
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoices');
    }
}
