<?php

namespace Modules\Order\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Order\Models\Order;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition()
    {
        $vat = $this->faker->randomElement([0, 5, 10, 15]);
        $itemsCount = $this->faker->numberBetween(1, 4);

        // We'll set totals after items created in seeder; create representative placeholders
        return [
            'order_number' => Order::generateUniqueOrderNumber(),
            'customer_id' => null,
            'customer_name' => $this->faker->optional(0.6)->name,
            'customer_phone' => 0170000000,
            'customer_address' => 'kaha se ate he e log',
            'customer_email' => $this->faker->optional(0.6)->safeEmail,
            'total' => 0,
            'vat_percent' => $vat,
            'vat_amount' => 0,
            'coupon_code' => null,
            'coupon_discount' => 0,
            'grand_total' => 0,
            'payment_status' => $this->faker->randomElement(['pending', 'unpaid', 'partial', 'paid', 'refunded']),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'processing',  'completed', 'cancelled']),
            'created_by' => null,
            'updated_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}