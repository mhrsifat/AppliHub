<?php

namespace Modules\Order\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Order\Database\Seeders\OrderSeeder;

class OrderDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $this->call([]);
        $this->call([
            OrderSeeder::class,
        ]);
    }
}
