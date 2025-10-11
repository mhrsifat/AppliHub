<?php

namespace Modules\Invoice\Traits;

trait CalculatesTotals
{
    /**
     * Calculate subtotal, vat amount and grand total.
     *
     * @param float $subtotal
     * @param float|null $vatPercent
     * @param float|null $couponDiscount
     * @return array
     */
    public function calculateTotals(float $subtotal, ?float $vatPercent = 0, ?float $couponDiscount = 0): array
    {
        $vatPercent = $vatPercent ?? 0;
        $couponDiscount = $couponDiscount ?? 0;

        // Ensure using proper precision
        $vatAmount = round($subtotal * ($vatPercent / 100), 2);
        $grandTotal = round($subtotal + $vatAmount - $couponDiscount, 2);

        if ($grandTotal < 0) {
            $grandTotal = 0.00;
        }

        return [
            'subtotal' => round($subtotal, 2),
            'vat_amount' => $vatAmount,
            'grand_total' => $grandTotal,
        ];
    }
}