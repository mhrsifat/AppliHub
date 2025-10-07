<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // 6-digit unique order number (string to preserve leading zeros)
            $table->string('order_number', 6)->unique();

            // Customer may be anonymous; still keep customer_id for known customers
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();

            // Summary amounts
            $table->decimal('total', 14, 2)->default(0); // sum of items before VAT & discounts
            $table->decimal('vat_percent', 5, 2)->default(0);
            $table->decimal('vat_amount', 14, 2)->default(0);

            $table->string('coupon_code')->nullable();
            $table->decimal('coupon_discount', 14, 2)->default(0); // absolute discount amount

            $table->decimal('grand_total', 14, 2)->default(0); // final due after vat/discount

            // payment_status: pending, partial, paid, refunded
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'refunded'])->default('pending');

            // status: draft, confirmed, completed, cancelled
            $table->enum('status', ['draft', 'confirmed', 'completed', 'cancelled'])->default('draft');

            // extra metadata
            $table->unsignedBigInteger('created_by')->nullable(); // staff who created the order
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->timestamps();

            // foreign keys (assuming users table exists)
            //$table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete()->nullOnDelete();
            //$table->foreign('updated_by')->references('id')->on('users')->cascadeOnDelete()->nullOnDelete();

            // if you have customers table, optionally add foreign key later
            // $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
