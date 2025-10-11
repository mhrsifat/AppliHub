<?php

namespace Modules\Invoice\Services;

//use Modules\Invoice\Traits\CalculatesTotals;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Modules\Invoice\Models\Invoice;

class InvoiceService
{
    //use CalculatesTotals;
    
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

    /**
     * Create invoice from payload
     *
     * @param array $data
     * @return Invoice
     */
    public function createFromPayload(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            if (!is_array($items) || empty($items)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'items' => ['At least one item is required.'],
                ]);
            }

            $invoice = Invoice::create([
                'order_id' => $data['order_id'] ?? null,
                'invoice_number' => $data['invoice_number'] ?? 'INV-' . strtoupper(Str::random(8)),
                'type' => $data['type'] ?? 'initial',
                'vat_percent' => $data['vat_percent'] ?? 0,
                'coupon_discount' => $data['coupon_discount'] ?? 0,
                'status' => $data['status'] ?? 'unpaid',
                'paid_amount' => $data['paid_amount'] ?? 0,
            ]);

            $subtotal = 0.0;

            foreach ($items as $it) {
                $unitPrice = isset($it['unit_price']) ? (float)$it['unit_price'] : 0.0;
                $quantity = isset($it['quantity']) ? (int)$it['quantity'] : 1;
                $lineTotal = round($unitPrice * $quantity, 2);
                $subtotal += $lineTotal;

                $invoice->items()->create([
                    'service_id' => $it['service_id'] ?? null,
                    'service_name' => $it['service_name'] ?? ($it['description'] ?? 'Item'),
                    'description' => $it['description'] ?? null,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                    'meta' => $it['meta'] ?? null,
                ]);
            }

            $totals = $this->calculateTotals($subtotal, $invoice->vat_percent, $invoice->coupon_discount);

            $invoice->update([
                'subtotal' => $totals['subtotal'],
                'vat_amount' => $totals['vat_amount'],
                'grand_total' => $totals['grand_total'],
            ]);

            return $invoice->fresh(['items', 'payments', 'order']);
        });
    }

    /**
     * Recalculate invoice totals and refresh model.
     * This function primarily relies on items sum if items exist.
     * If there are no items, it will preserve existing subtotal/grand_total.
     *
     * @param Invoice $invoice
     * @return Invoice
     */// In InvoiceService - ensure recalcAndRefresh properly calculates status
     
     // In InvoiceService - Fix the recalcAndRefresh method// In InvoiceService - Fix the recalcAndRefresh method
public function recalcAndRefresh(Invoice $invoice): Invoice
{
    return DB::transaction(function () use ($invoice) {
        $invoice->load('items');

        // Sum all items line totals
        $itemsSum = (float) $invoice->items->sum(function ($item) {
            $lineTotal = $item->line_total ?? round($item->unit_price * $item->quantity, 2);
            return (float) $lineTotal;
        });

        // Use items sum as subtotal
        $subtotal = $itemsSum;

        $totals = $this->calculateTotals($subtotal, $invoice->vat_percent, $invoice->coupon_discount);

        // Update ONLY the totals, preserve paid_amount
        $invoice->update([
            'subtotal' => $totals['subtotal'],
            'vat_amount' => $totals['vat_amount'],
            'grand_total' => $totals['grand_total'],
        ]);

        // Refresh the invoice to get updated values
        $invoice->refresh();

        // Calculate status based on paid_amount vs grand_total
        $paid = (float) $invoice->paid_amount;
        $grandTotal = (float) $invoice->grand_total;

        $status = 'unpaid';
        if ($grandTotal > 0) {
            if ($paid >= $grandTotal) {
                $status = 'paid';
            } elseif ($paid > 0) {
                $status = 'partially_paid';
            }
        }

        // Update status if changed
        if ($invoice->status !== $status) {
            $invoice->update(['status' => $status]);
        }

        return $invoice->fresh(['items', 'payments', 'order']);
    });
}

     

    /**
     * Convenience helper: if you want service-level add and recalc.
     * (Not used by controller's addItem in this version because controller
     * handles merge-with-existing-grand_total semantics.)
     *
     * @param Invoice $invoice
     * @param array $itemPayload
     * @return Invoice
     */
    public function addItemAndRecalc(Invoice $invoice, array $itemPayload): Invoice
    {
        return DB::transaction(function () use ($invoice, $itemPayload) {
            $invoice->items()->create([
                'service_id' => $itemPayload['service_id'] ?? null,
                'service_name' => $itemPayload['service_name'] ?? ($itemPayload['description'] ?? 'Item'),
                'description' => $itemPayload['description'] ?? null,
                'unit_price' => (float) ($itemPayload['unit_price'] ?? 0),
                'quantity' => (int) ($itemPayload['quantity'] ?? 1),
                'line_total' => round((float) ($itemPayload['unit_price'] ?? 0) * (int) ($itemPayload['quantity'] ?? 1), 2),
                'meta' => $itemPayload['meta'] ?? null,
            ]);

            return $this->recalcAndRefresh($invoice);
        });
    }
}