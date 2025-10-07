<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRefundsTable extends Migration
{
    public function up()
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();

            // refunds belong to invoice (and have invoice_payment_id optional)
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignId('invoice_payment_id')->nullable()->constrained('invoice_payments')->nullOnDelete();

            $table->decimal('amount', 12, 2);
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->text('note')->nullable();

            $table->enum('status', ['pending','completed','failed'])->default('completed');

            $table->timestamps();

            $table->index('invoice_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('refunds');
    }
}