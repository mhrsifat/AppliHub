<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable()->unique();
            $table->string('password');
            $table->string('avatar')->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('email_verified_at')->nullable();

            // Audit columns (optional but professional)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
