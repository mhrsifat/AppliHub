<?php
// filepath: Modules/Invoice/Services/InvoiceService.php

namespace Modules\Invoice\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Modules\Invoice\Models\Invoice;

class InvoiceService
{
    /**
     * Calculate subtotal, vat, and grand total
     */
    public function calculateTotals(float $subtotal, ?float $vatPercent = 0, ?float $couponDiscount = 0): array
    {
        $vatPercent = $vatPercent ?? 0;
        $couponDiscount = $couponDiscount ?? 0;

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
     * Calculate carryover (excess paid amount) from previous invoices
     */
    public function calculateCarryoverPayment($order, $newInvoiceId = null): float
    {
        $totalPaid = 0.0;
        $totalInvoiced = 0.0;

        // iterate invoices (skip the new/excluded invoice if provided)
        foreach ($order->invoices as $invoice) {
            if ($newInvoiceId !== null && $invoice->id == $newInvoiceId) {
                continue;
            }

            $paid = (float) $invoice->payments()
                ->where('status', 'completed')
                ->sum('amount');

            $totalPaid += $paid;
            $totalInvoiced += (float) ($invoice->grand_total ?? 0);
        }

        $carryover = $totalPaid - $totalInvoiced;
        return $carryover > 0 ? $carryover : 0.0;
    }

    /**
     * Recalculate invoice totals and refresh model.
     */
    public function recalcAndRefresh(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice) {
            $invoice->load('items');

            // Sum all items line_total (fallback to unit_price * quantity)
            $subtotal = (float) $invoice->items->sum(function ($item) {
                return (float) ($item->line_total ?? round($item->unit_price * $item->quantity, 2));
            });

            $totals = $this->calculateTotals($subtotal, $invoice->vat_percent, $invoice->coupon_discount);

            $invoice->update([
                'subtotal' => $totals['subtotal'],
                'vat_amount' => $totals['vat_amount'],
                'grand_total' => $totals['grand_total'],
            ]);

            $invoice->refresh();

            // Compute invoice status based on paid_amount vs grand_total
            $paid = (float) ($invoice->paid_amount ?? 0);
            $grandTotal = (float) ($invoice->grand_total ?? 0);

            $status = 'unpaid';
            if ($grandTotal > 0.0) {
                if ($paid >= $grandTotal) {
                    $status = 'paid';
                } elseif ($paid > 0.0) {
                    $status = 'partially_paid';
                }
            }

            if ($invoice->status !== $status) {
                $invoice->update(['status' => $status]);
            }

            // If invoice attached to order, update order payment_status
            if ($invoice->order) {
                $order = $invoice->order->fresh(['invoices', 'invoices.payments']);

                $allPaid = true;
                $anyPartial = false;

                foreach ($order->invoices as $inv) {
                    if ($inv->status !== 'paid') {
                        $allPaid = false;
                    }
                    if ($inv->status === 'partially_paid') {
                        $anyPartial = true;
                    }
                }

                $newStatus = 'unpaid';
                if ($allPaid && $order->invoices->count() > 0) {
                    $newStatus = 'paid';
                } elseif ($anyPartial) {
                    $newStatus = 'partially_paid';
                }

                if ($order->payment_status !== $newStatus) {
                    $order->update(['payment_status' => $newStatus]);
                }
            }

            return $invoice->fresh(['items', 'payments', 'order']);
        });
    }

    /**
     * Add an item to invoice and recalc totals
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
