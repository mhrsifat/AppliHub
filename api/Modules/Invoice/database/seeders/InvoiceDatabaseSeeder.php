<?php

namespace Modules\Invoice\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Invoice\Database\Seeders\InvoiceModuleSeeder;

class InvoiceDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $this->call([]);
        $this->call(InvoiceModuleSeeder::class);
    }
}
