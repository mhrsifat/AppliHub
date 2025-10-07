<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServiceAddonsTable extends Migration
{
    public function up()
    {
        Schema::create('service_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('title');
            $table->string('sku')->nullable();
            $table->decimal('price', 14, 2)->default(0);
            $table->boolean('vat_applicable')->default(true);
            $table->decimal('vat_percent', 5, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::table('service_addons', function (Blueprint $table) {
            $table->index(['service_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_addons');
    }
}
