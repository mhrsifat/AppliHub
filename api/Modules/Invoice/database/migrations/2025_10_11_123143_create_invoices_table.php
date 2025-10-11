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
            $table->unsignedBigInteger('order_id'); // foreign key

            $table->string('invoice_number')->unique();
            $table->enum('type', ['initial', 'additional', 'refund', 'standard'])->default('initial');

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('vat_percent', 5, 2)->default(0);
            $table->decimal('vat_amount', 12, 2)->default(0);
            $table->decimal('coupon_discount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0); // must exist
            
            $table->enum('status', ['draft', 'issued', 'unpaid', 'partially_paid', 'paid', 'refunded', 'cancelled'])
                ->default('draft');

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
