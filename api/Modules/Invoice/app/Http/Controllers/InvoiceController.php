<?php

namespace Modules\Invoice\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Illuminate\Support\Facades\Mail;

use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoiceItem;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Invoice\Models\Refund;
use Modules\Invoice\Http\Requests\StoreInvoiceRequest;
use Modules\Invoice\Http\Requests\RecordPaymentRequest;
use Modules\Invoice\Http\Requests\RefundRequest;
use Modules\Invoice\Transformers\InvoiceResource;

class InvoiceController extends Controller
{
    protected $validation;

    public function __construct(ValidationFactory $validation)
    {
        $this->validation = $validation;
    }

    // List invoices
    public function index(Request $request)
    {
        $q = Invoice::with(['items', 'payments', 'refunds', 'order'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('order_id')) {
            $q->where('order_id', $request->order_id);
        }

        return InvoiceResource::collection($q->paginate(25));
    }

    // Show invoice
    public function show(Invoice $invoice)
    {
        $invoice->load(['items', 'payments', 'refunds', 'order']);
        return new InvoiceResource($invoice);
    }

    // Create invoice (accepts StoreInvoiceRequest or plain Request)
    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request instanceof StoreInvoiceRequest ? $request->validated() : $request->all();

            $invoiceNumber = $data['invoice_number'] ?? 'INV-' . strtoupper(Str::random(8));

            $invoice = Invoice::create([
                'order_id' => $data['order_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'type' => $data['type'] ?? 'initial',
                'vat_percent' => $data['vat_percent'] ?? 0,
                'coupon_discount' => $data['coupon_discount'] ?? 0,
                'status' => 'issued',
            ]);

            $subtotal = 0;
            foreach ($data['items'] as $it) {
                $lineTotal = bcmul((string)$it['unit_price'], (string)$it['quantity'], 2);
                $subtotal += (float)$lineTotal;

                $invoice->items()->create([
                    'service_id' => $it['service_id'] ?? null,
                    'service_name' => $it['service_name'],
                    'description' => $it['description'] ?? null,
                    'unit_price' => $it['unit_price'],
                    'quantity' => $it['quantity'],
                    'line_total' => $lineTotal,
                    'meta' => $it['meta'] ?? null,
                ]);
            }

            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $coupon = (float) ($invoice->coupon_discount ?? 0);
            $grandTotal = round($subtotal + $vatAmount - $coupon, 2);
            if ($grandTotal < 0) $grandTotal = 0;

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => $grandTotal,
            ]);

            // Load relations for email
            $invoice->load('items', 'order');

            // Send email to customer if order has email
            $order = $invoice->order;
            $recipient = $order->customer_email ?? $order->customer_email ?? null;

            if ($recipient) {
                $html = $this->buildInvoiceHtml($invoice);
                Mail::send([], [], function ($message) use ($recipient, $invoice, $html) {
                    $message->to($recipient)
                        ->subject("Invoice #{$invoice->invoice_number}")
                        ->setBody($html, 'text/html');
                });
            }

            return new InvoiceResource($invoice->fresh(['items', 'payments']));
        });
    }

    // Update invoice (status/meta/vat/coupon)
    public function update(Request $request, Invoice $invoice)
    {
        $payload = $request->only(['status', 'meta', 'vat_percent', 'coupon_discount']);

        if (isset($payload['vat_percent'])) $invoice->vat_percent = $payload['vat_percent'];
        if (isset($payload['coupon_discount'])) $invoice->coupon_discount = $payload['coupon_discount'];
        if (isset($payload['status'])) $invoice->status = $payload['status'];
        if (isset($payload['meta'])) $invoice->meta = $payload['meta'];

        if (isset($payload['vat_percent']) || isset($payload['coupon_discount'])) {
            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);
            $invoice->subtotal = $subtotal;
            $invoice->vat_amount = $vatAmount;
            $invoice->grand_total = max(0, $grandTotal);
        }

        $invoice->save();

        $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
        if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
            $invoice->status = 'paid';
            $invoice->save();
        } elseif ($paid > 0) {
            $invoice->status = 'partially_paid';
            $invoice->save();
        }

        return new InvoiceResource($invoice->fresh(['items', 'payments', 'refunds']));
    }

    // Add item to invoice
    public function addItem(Request $request, Invoice $invoice)
    {
        $this->validate($request, [
            'service_name' => 'required|string',
            'unit_price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'service_id' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $invoice) {
            $it = $invoice->items()->create([
                'service_id' => $request->service_id,
                'service_name' => $request->service_name,
                'description' => $request->description,
                'unit_price' => $request->unit_price,
                'quantity' => $request->quantity,
                'line_total' => round($request->unit_price * $request->quantity, 2),
                'meta' => $request->meta ?? null,
            ]);

            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => max(0, $grandTotal),
            ]);

            $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
            if ($paid >= $invoice->grand_total) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            }

            return response()->json([
                'item' => $it,
                'invoice' => $invoice->fresh(['items', 'payments']),
            ], 201);
        });
    }

    // Update invoice item
    public function updateItem(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        $this->validate($request, [
            'unit_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'service_name' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message' => 'mismatch'], 422);
        }

        return DB::transaction(function () use ($request, $invoice, $item) {
            $item->fill($request->only(['service_name', 'description', 'unit_price', 'quantity', 'meta']));
            if ($request->filled('unit_price') || $request->filled('quantity')) {
                $item->line_total = round($item->unit_price * $item->quantity, 2);
            }
            $item->save();

            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => max(0, $grandTotal),
            ]);

            $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            }

            return response()->json($invoice->fresh(['items', 'payments']));
        });
    }

    // Remove invoice item
    public function removeItem(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message' => 'mismatch'], 422);
        }

        return DB::transaction(function () use ($invoice, $item) {
            $item->delete();

            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => max(0, $grandTotal),
            ]);

            $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            } else {
                if (!in_array($invoice->status, ['refunded', 'cancelled'])) {
                    $invoice->status = 'issued';
                    $invoice->save();
                }
            }

            return response()->json($invoice->fresh(['items', 'payments']));
        });
    }

    // Record a payment
    public function recordPayment(RecordPaymentRequest $request, Invoice $invoice)
    {
        return DB::transaction(function () use ($request, $invoice) {
            $data = $request->validated();

            $payment = $invoice->payments()->create([
                'payment_reference' => $data['payment_reference'] ?? null,
                'staff_id' => $data['staff_id'] ?? null,
                'amount' => $data['amount'],
                'method' => $data['method'] ?? 'cash',
                'status' => 'completed',
                'note' => $data['note'] ?? null,
            ]);

            $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
            }
            $invoice->save();

            // Send payment email if customer email exists
            $invoice->load('order', 'items', 'payments');
            $order = $invoice->order;
            $recipient = $order->customer_email ?? $order->customer_email ?? null;

            if ($recipient) {
                $html = $this->buildPaymentHtml($invoice, $payment);
                Mail::send([], [], function ($message) use ($recipient, $invoice, $html) {
                    $message->to($recipient)
                        ->subject("Payment received for Invoice #{$invoice->invoice_number}")
                        ->setBody($html, 'text/html');
                });
            }

            return response()->json([
                'payment' => $payment,
                'invoice' => $invoice->fresh(['payments', 'items'])
            ], 201);
        });
    }

    // Refund
    public function refund(RefundRequest $request, Invoice $invoice)
    {
        return DB::transaction(function () use ($request, $invoice) {
            $data = $request->validated();

            $amount = $data['amount'];
            $paid = $invoice->payments()->where('status', 'completed')->sum('amount');
            $alreadyRefunded = $invoice->refunds()->where('status', 'completed')->sum('amount');
            $available = $paid - $alreadyRefunded;
            if ($amount > $available) {
                return response()->json([
                    'message' => 'refund exceeds available paid amount',
                    'available' => $available
                ], 422);
            }

            $refund = Refund::create([
                'invoice_id' => $invoice->id,
                'invoice_payment_id' => $data['invoice_payment_id'] ?? null,
                'amount' => $amount,
                'staff_id' => $data['staff_id'] ?? null,
                'reason' => $data['reason'],
                'note' => $data['note'] ?? null,
                'status' => 'completed',
            ]);

            if (!empty($data['invoice_payment_id'])) {
                $pay = $invoice->payments()->find($data['invoice_payment_id']);
                if ($pay) {
                    $pay->status = 'refunded';
                    $pay->save();
                }
            }

            $totalRefunded = $invoice->refunds()->where('status', 'completed')->sum('amount');
            if ($totalRefunded >= $invoice->paid_amount && $invoice->paid_amount > 0) {
                $invoice->status = 'refunded';
            }
            $invoice->save();

            return response()->json([
                'refund' => $refund,
                'invoice' => $invoice->fresh(['payments', 'refunds']),
            ], 201);
        });
    }

    // Create invoice from order (helper)
    public function createFromOrder(Request $request, $orderId)
    {
        $order = \Modules\Order\Models\Order::with('items')->findOrFail($orderId);

        $items = $order->items->map(function($oi) {
            return [
                'service_id' => $oi->service_id ?? null,
                'service_name' => $oi->service_name ?? $oi->name ?? 'Service',
                'description' => $oi->service_description ?? null,
                'unit_price' => $oi->unit_price,
                'quantity' => $oi->quantity,
            ];
        })->toArray();

        $invoiceRequest = new Request([
            'order_id' => $order->id,
            'type' => 'initial',
            'vat_percent' => $order->vat_percent ?? 0,
            'coupon_discount' => $order->coupon_discount ?? 0,
            'items' => $items,
        ]);

        $validator = $this->validation->make(
            $invoiceRequest->all(),
            app(StoreInvoiceRequest::class)->rules()
        );

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        return $this->store($invoiceRequest);
    }

    // Helpers: inline HTML builders (keeps file count low)
    protected function buildInvoiceHtml(Invoice $invoice)
    {
        $order = $invoice->order;
        $lines = '';
        foreach ($invoice->items as $it) {
            $lines .= "<tr>
                <td style='padding:6px;border-bottom:1px solid #eee'>{$it->service_name}</td>
                <td style='padding:6px;border-bottom:1px solid #eee;text-align:right'>{$it->quantity}</td>
                <td style='padding:6px;border-bottom:1px solid #eee;text-align:right'>".number_format($it->unit_price,2)."</td>
                <td style='padding:6px;border-bottom:1px solid #eee;text-align:right'>".number_format($it->line_total,2)."</td>
            </tr>";
        }

        $html = "<div style='font-family:Arial,Helvetica,sans-serif;line-height:1.4'>
        <h2>Invoice #{$invoice->invoice_number}</h2>
        <p>Order: #{$invoice->order_id}</p>
        <p>Customer: ".htmlspecialchars($order->customer_name ?? $order->customer_name ?? 'Customer')."</p>
        <table width='100%' style='border-collapse:collapse'>
            <thead>
                <tr>
                    <th style='text-align:left;padding:6px'>Service</th>
                    <th style='text-align:right;padding:6px'>Qty</th>
                    <th style='text-align:right;padding:6px'>Unit</th>
                    <th style='text-align:right;padding:6px'>Total</th>
                </tr>
            </thead>
            <tbody>
                {$lines}
            </tbody>
        </table>
        <p>Subtotal: ".number_format($invoice->subtotal,2)."</p>
        <p>VAT ({$invoice->vat_percent}%): ".number_format($invoice->vat_amount,2)."</p>
        <p>Coupon Discount: ".number_format($invoice->coupon_discount,2)."</p>
        <h3>Grand Total: ".number_format($invoice->grand_total,2)."</h3>
        </div>";

        return $html;
    }

    protected function buildPaymentHtml(Invoice $invoice, $payment)
    {
        $html = "<div style='font-family:Arial,Helvetica,sans-serif;line-height:1.4'>
        <h3>Payment received</h3>
        <p>Invoice: {$invoice->invoice_number}</p>
        <p>Amount: ".number_format($payment->amount,2)."</p>
        <p>Method: ".htmlspecialchars($payment->method)."</p>
        <p>Status: {$payment->status}</p>
        </div>";

        return $html;
    }
}