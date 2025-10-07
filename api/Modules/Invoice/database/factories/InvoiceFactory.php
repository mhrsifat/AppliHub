<?php

namespace Modules\Invoice\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Invoice\Models\Invoice;
use Illuminate\Support\Str;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition()
    {
        $subtotal = $this->faker->randomFloat(2, 100, 1000);
        $vatPercent = 15; // example fixed VAT
        $vatAmount = round($subtotal * $vatPercent / 100, 2);
        $couponDiscount = $this->faker->randomFloat(2, 0, 50);
        $grandTotal = $subtotal + $vatAmount - $couponDiscount;

        return [
            'order_id' => null,
            'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
            'type' => 'standard',
            'subtotal' => $subtotal,
            'vat_percent' => $vatPercent,
            'vat_amount' => $vatAmount,
            'coupon_discount' => $couponDiscount,
            'grand_total' => $grandTotal,
            'status' => $this->faker->randomElement(['unpaid', 'partially_paid', 'paid']),
            'meta' => [],
        ];
    }
}
