<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Modules\Invoice\Models\Invoice;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition()
    {
        $subtotal = $this->faker->randomFloat(2, 10, 1000);
        $vatPercent = $this->faker->randomElement([0,5,10,15]);
        $vatAmount = round($subtotal * ($vatPercent/100), 2);
        $coupon = $this->faker->randomElement([0,0,5,10]);
        $grand = max(0, $subtotal + $vatAmount - $coupon);

        return [
            'order_id' => null, // set when creating
            'invoice_number' => 'INV-' . strtoupper($this->faker->bothify('??###??')),
            'type' => 'initial',
            'subtotal' => $subtotal,
            'vat_percent' => $vatPercent,
            'vat_amount' => $vatAmount,
            'coupon_discount' => $coupon,
            'grand_total' => $grand,
            'status' => $grand === 0 ? 'paid' : 'issued',
        ];
    }
}