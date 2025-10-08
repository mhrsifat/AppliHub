<?php

namespace Modules\Order\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;

class OrderSeeder extends Seeder
{
    public function run()
    {
        // Create 30 example orders with items
        \DB::transaction(function () {
            for ($i = 0; $i < 30; $i++) {
                $vat = [0, 5, 10, 15][array_rand([0,1,2,3])];

                $order = Order::create([
                    'order_number' => Order::generateUniqueOrderNumber(),
                    'customer_id' => (rand(0,1) ? rand(1, 20) : null),
                    'customer_name' => rand(0,1) ? null : \Faker\Factory::create()->name,
                    'customer_email' => rand(0,1) ? null : \Faker\Factory::create()->safeEmail,
                    'vat_percent' => $vat,
                    'coupon_code' => (rand(0,4) === 0) ? 'DISC10' : null,
                    'coupon_discount' => 0,
                    'payment_status' => 'pending',
                    'status' => 'confirmed',
                ]);

                // create 1-4 items
                $itemsCount = rand(1,4);
                $total = 0;
                for ($j = 0; $j < $itemsCount; $j++) {
                    $unit = rand(100, 2000)/1;
                    $qty = rand(1,3);
                    $item = new OrderItem([
                        'service_id' => null,
                        'service_name' => \Faker\Factory::create()->words(3, true),
                        'service_description' => \Faker\Factory::create()->optional()->sentence,
                        'unit_price' => $unit,
                        'quantity' => $qty,
                        'total_price' => round($unit * $qty, 2),
                        'added_by' => null,
                    ]);
                    $order->items()->save($item);
                    $total += $item->total_price;
                }

                // compute vat and coupon
                $vatAmount = round(($vat / 100) * $total, 2);

                $couponDiscount = 0;
                if ($order->coupon_code === 'DISC10') {
                    $couponDiscount = round(0.10 * ($total + $vatAmount), 2);
                }

                $grand = round($total + $vatAmount - $couponDiscount, 2);

                $order->update([
                    'total' => $total,
                    'vat_amount' => $vatAmount,
                    'coupon_discount' => $couponDiscount,
                    'grand_total' => $grand,
                ]);

                // optionally set some as partially paid / paid
                $rand = rand(0, 10);
                if ($rand < 2) $order->update(['payment_status' => 'paid', 'status' => 'completed']);
                elseif ($rand < 4) $order->update(['payment_status' => 'partial']);
            }
        });
    }
}