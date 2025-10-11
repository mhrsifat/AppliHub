<?php

namespace Modules\Blog\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Blog\Database\Seeders\BlogModuleSeeder;
use Modules\Blog\Database\Seeders\BlogSeeder;

class BlogDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([BlogModuleSeeder::class]);
        $this->call([BlogSeeder::class]);
    }
}
