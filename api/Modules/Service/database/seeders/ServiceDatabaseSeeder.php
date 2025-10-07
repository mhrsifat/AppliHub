<?php

namespace Modules\Service\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Service\Database\Seeders\ServiceSeeder;

class ServiceDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $this->call([]);
        $this->call([
            ServiceSeeder::class,
        ]);
    }
}
