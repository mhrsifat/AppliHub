<?php

namespace Modules\Service\Database\Factories;

use Modules\Service\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition()
    {
        $title = $this->faker->unique()->sentence(3);
        $price = $this->faker->randomFloat(2, 5, 500);
        $vat = $this->faker->randomElement([0, 5, 10, 15]);

        return [
            'title' => $title,
            'slug' => Str::slug($title) . '-' . $this->faker->unique()->numberBetween(1,999),
            'sku' => strtoupper($this->faker->bothify('SRV-###??')),
            'description' => $this->faker->paragraph(),
            'price' => $price,
            'vat_applicable' => $vat > 0,
            'vat_percent' => $vat,
            'price_includes_vat' => false,
            'is_active' => true,
            'stock' => $this->faker->numberBetween(0, 100),
        ];
    }
}
