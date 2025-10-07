<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Employee\Database\Seeders\EmployeeDatabaseSeeder;
use Modules\Order\Database\Seeders\OrderDatabaseSeeder;
use Modules\Invoice\Database\Seeders\InvoiceDatabaseSeeder;
use Modules\Service\Database\Seeders\ServiceSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
      
      $this->call([
            PermissionSeeder::class,
        ]);
        // Call UserSeeder
        $this->call([
            UserSeeder::class,
        ]);
        
        $this->call(EmployeeDatabaseSeeder::class);
        $this->call(OrderDatabaseSeeder::class);
        $this->call(InvoiceDatabaseSeeder::class);
        $this->call(ServiceSeeder::class);
    }
}