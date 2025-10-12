<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDeletedAtToInvoicesTable extends Migration
{
  public function up()
  {
    if (Schema::hasTable('invoices')) {
      Schema::table('invoices', function (Blueprint $table) {
        if (!Schema::hasColumn('invoices', 'deleted_at')) {
          $table->softDeletes();
        }
      });
    }
  }

  public function down()
  {
    if (Schema::hasTable('invoices')) {
      Schema::table('invoices', function (Blueprint $table) {
        if (Schema::hasColumn('invoices', 'deleted_at')) {
          $table->dropSoftDeletes();
        }
      });
    }
  }
}
