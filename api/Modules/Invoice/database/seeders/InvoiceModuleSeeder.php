<?php

namespace Modules\Invoice\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoiceItem;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Invoice\Models\Refund;
use Modules\Order\Models\Order;
use App\Models\User;
use Illuminate\Support\Str;

class InvoiceModuleSeeder extends Seeder
{
    public function run()
    {
        // Ensure there are some orders to attach invoices to. If none exist, create placeholder anonymous orders.
        if (Order::count() === 0) {
            Order::factory()->count(5)->create([
                'customer_id' => null,
                'total' => 0,
                'status' => 'pending',
            ]);
        }

        $staff = User::first(); // staff user for payments/refunds
        $orders = Order::inRandomOrder()->limit(8)->get();

        foreach ($orders as $order) {

            // create invoice
            $invoice = Invoice::factory()->create([
                'order_id' => $order->id,
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
            ]);

            // add 1..3 items safely
            $itemsCount = rand(1,3);
            $subtotal = 0;
            for ($i = 0; $i < $itemsCount; $i++) {
                $item = InvoiceItem::factory()->create([
                    'invoice_id' => $invoice->id
                ]);
                $subtotal += (float) $item->line_total;
            }

            // calculate VAT and grand total
            $vatAmount = round($subtotal * ($invoice->vat_percent / 100), 2);
            $grand = round($subtotal + $vatAmount - $invoice->coupon_discount, 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => $grand
            ]);

            // optionally create a payment
            if (rand(0,1)) {
                $paid = round($grand * rand(30,100) / 100, 2);

                $payment = InvoicePayment::create([
                    'invoice_id' => $invoice->id,
                    'payment_reference' => 'PAY-' . strtoupper(Str::random(8)),
                    'staff_id' => $staff?->id,
                    'amount' => $paid,
                    'method' => 'card',
                    'status' => 'completed',
                ]);

                // update invoice status based on payment
                $invoice->status = ($paid >= $grand) ? 'paid' : 'partially_paid';
                $invoice->save();
            }

            // occasionally create refund
            if (rand(0,10) > 8) {
                $firstPayment = $invoice->payments()->first();
                if ($firstPayment) {
                    Refund::create([
                        'invoice_id' => $invoice->id,
                        'invoice_payment_id' => $firstPayment->id,
                        'amount' => round(min($invoice->payments()->sum('amount'), $invoice->grand_total) * 0.2, 2),
                        'staff_id' => $staff?->id,
                        'reason' => 'Sample refund for testing',
                        'note' => 'Automated seed refund',
                        'status' => 'completed',
                    ]);
                }
            }
        }
    }
}
