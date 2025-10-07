<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoicePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');

            // optional reference to order payment gateway transaction
            $table->string('payment_reference')->nullable();

            // who accepted it (staff id) - nullable if automated
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('amount', 12, 2);
            $table->enum('method', ['cash','card','bank_transfer','online','adjustment','other'])->default('cash');
            $table->enum('status', ['pending','completed','failed','refunded'])->default('completed');

            $table->text('note')->nullable();

            $table->timestamps();

            $table->index(['invoice_id','status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoice_payments');
    }
}