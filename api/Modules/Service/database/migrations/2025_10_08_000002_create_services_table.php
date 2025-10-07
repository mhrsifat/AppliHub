<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServicesTable extends Migration
{
    public function up()
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('title')->index();
            $table->string('slug')->unique();
            $table->string('sku')->nullable()->index();
            $table->foreignId('service_category_id')->nullable()->constrained('service_categories')->nullOnDelete();
            $table->text('description')->nullable();
            $table->decimal('price', 14, 2)->default(0);
            $table->boolean('price_includes_vat')->default(false);
            $table->boolean('vat_applicable')->default(true);
            $table->decimal('vat_percent', 5, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('stock')->nullable();
            $table->json('meta')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('services');
    }
}
