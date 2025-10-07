<?php

namespace Modules\Service\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Service\Models\Service;
use Modules\Service\Models\ServiceCategory;
use Illuminate\Support\Str;

class ServiceSeeder extends Seeder
{
    public function run()
    {
        $categories = collect(['Basic','Premium','Consulting','Maintenance'])->map(function($name){
            return ServiceCategory::firstOrCreate(['slug'=>Str::slug($name)], ['name'=>$name]);
        });

        Service::factory(20)->create()->each(function($service) use ($categories) {
            $service->service_category_id = $categories->random()->id;
            $service->save();
        });
    }
}
