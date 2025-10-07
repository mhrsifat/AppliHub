<?php

namespace Modules\Invoice\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Invoice\Models\InvoiceItem;

class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    public function definition()
    {
        $price = $this->faker->randomFloat(2, 5, 200);
        $qty = $this->faker->numberBetween(1,3);
        return [
            'service_id' => null,
            'service_name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'unit_price' => $price,
            'quantity' => $qty,
            'line_total' => round($price * $qty, 2),
        ];
    }
}