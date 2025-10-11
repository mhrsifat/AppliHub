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
    Schema::table('employees', function (Blueprint $table) {
      // short location name (city/branch) and full textual address
      $table->string('location')->nullable()->after('avatar');
      $table->text('full_address')->nullable()->after('location');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('employees', function (Blueprint $table) {
      $table->dropColumn(['location', 'full_address']);
    });
  }
};
