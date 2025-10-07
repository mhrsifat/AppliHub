<?php

namespace Modules\Order\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Order\Models\OrderItem;
use Modules\Order\Models\Order;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition()
    {
        $unitPrice = $this->faker->randomFloat(2, 50, 2000);
        $qty = $this->faker->numberBetween(1, 3);

        return [
            'order_id' => Order::factory(),
            'service_id' => null,
            'service_name' => $this->faker->words(3, true),
            'service_description' => $this->faker->optional()->sentence,
            'unit_price' => $unitPrice,
            'quantity' => $qty,
            'total_price' => round($unitPrice * $qty, 2),
            'added_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}