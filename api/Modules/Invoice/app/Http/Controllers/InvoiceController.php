<?php

namespace Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoiceItem;
use Modules\Invoice\Transformers\InvoiceResource;
use Modules\Invoice\Services\InvoiceService;
use Modules\Invoice\Http\Requests\StoreInvoiceRequest;
use Modules\Order\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;


class InvoiceController extends Controller
{
    protected InvoiceService $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    // List invoices with filters
    public function index(Request $request)
    {
        $q = Invoice::with(['items', 'payments', 'refunds', 'order'])->orderBy('created_at', 'desc');

        if ($request->filled('order_id')) {
            $q->where('order_id', $request->order_id);
        }

        return InvoiceResource::collection($q->paginate(25));
    }

    // Show single invoice
    public function show(Invoice $invoice)
    {
        $invoice->load(['items', 'payments', 'refunds', 'order']);
        return new InvoiceResource($invoice);
    }

    // Create invoice from payload
    public function store(Request $request)
    {
        $data = $request instanceof StoreInvoiceRequest ? $request->validated() : $request->all();
        $invoice = $this->invoiceService->createFromPayload($data);

        $this->syncOrderPayment($invoice);

        return new InvoiceResource($invoice);
    }

    // Update invoice (status/meta/vat/coupon)
    public function update(Request $request, Invoice $invoice)
    {
        $payload = $request->only(['status', 'meta', 'vat_percent', 'coupon_discount']);

        if (isset($payload['vat_percent'])) $invoice->vat_percent = $payload['vat_percent'];
        if (isset($payload['coupon_discount'])) $invoice->coupon_discount = $payload['coupon_discount'];
        if (isset($payload['status'])) $invoice->status = $payload['status'];
        if (isset($payload['meta'])) $invoice->meta = $payload['meta'];

        $invoice = $this->invoiceService->recalcAndRefresh($invoice);

        $this->syncOrderPayment($invoice);

        return new InvoiceResource($invoice->fresh(['items', 'payments', 'refunds']));
    }

    // Add an item to invoice
    
    
    // In InvoiceController - Fix the addItem method
public function addItem(Request $request, Invoice $invoice)
{
    $validated = $request->validate([
        'service_name' => 'required|string',
        'unit_price' => 'required|numeric|min:0',
        'quantity' => 'required|integer|min:1',
        'service_id' => 'nullable|integer',
        'description' => 'nullable|string',
        'meta' => 'nullable',
    ]);

    return DB::transaction(function () use ($validated, $invoice) {
        // Create the new item
        $item = $invoice->items()->create([
            'service_id' => $validated['service_id'] ?? null,
            'service_name' => $validated['service_name'],
            'description' => $validated['description'] ?? null,
            'unit_price' => (float) $validated['unit_price'],
            'quantity' => (int) $validated['quantity'],
            'line_total' => round((float)$validated['unit_price'] * (int)$validated['quantity'], 2),
            'meta' => $validated['meta'] ?? null,
        ]);

        // Use the service to recalculate totals - this should now properly sum all items
        $invoice = $this->invoiceService->recalcAndRefresh($invoice);

        // Sync order
        $this->syncOrderPayment($invoice);

        return response()->json([
            'item' => $item,
            'invoice' => $invoice->fresh(['items', 'payments', 'order']),
        ], 201);
    });
}

    // Update invoice item
    public function updateItem(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        $validated = $request->validate([
            'unit_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'service_name' => 'nullable|string',
            'description' => 'nullable|string',
            'meta' => 'nullable',
        ]);

        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message' => 'mismatch'], 422);
        }

        return DB::transaction(function () use ($validated, $invoice, $item) {
            $item->fill($validated);
            if (isset($validated['unit_price']) || isset($validated['quantity'])) {
                $item->line_total = round($item->unit_price * $item->quantity, 2);
            }
            $item->save();

            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPayment($invoice);

            return response()->json([
                'item' => $item,
                'invoice' => $invoice,
            ], 200);
        });
    }

    // Delete invoice item
    public function deleteItem(Invoice $invoice, InvoiceItem $item)
    {
        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message' => 'mismatch'], 422);
        }

        return DB::transaction(function () use ($invoice, $item) {
            $item->delete();
            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPayment($invoice);

            return response()->json([
                'invoice' => $invoice,
            ], 200);
        });
    }

    // Create invoice from order (optionally accept items override)
    public function createFromOrder(Request $request, $orderId)
    {
        $order = Order::with('items')->findOrFail($orderId);

        $items = $request->input('items');
        if (!is_array($items) || empty($items)) {
            $items = $order->items->map(fn($it) => [
                'service_id' => $it->service_id,
                'service_name' => $it->service_name,
                'description' => $it->service_description ?? null,
                'unit_price' => $it->unit_price,
                'quantity' => $it->quantity,
                'meta' => $it->meta ?? null,
            ])->toArray();
        }

        $payload = [
            'order_id' => $order->id,
            'vat_percent' => $request->input('vat_percent', $order->vat_percent),
            'coupon_discount' => $request->input('coupon_discount', $order->coupon_discount),
            'invoice_number' => $request->input('invoice_number', 'INV-'.Str::upper(Str::random(8))),
            'type' => $request->input('type', 'initial'),
            'items' => $items,
        ];

        $invoice = $this->invoiceService->createFromPayload($payload);
        $this->syncOrderPayment($invoice);

        return response()->json([
            'invoice' => $invoice
        ], 201);
    }

    // --- Helper ---
    private function syncOrderPayment(Invoice $invoice)
    {
        if (!$invoice->order) {
            return;
        }

        $order = $invoice->order;
        $order->payment_status = match ($invoice->status) {
            'paid' => 'paid',
            'partially_paid' => 'partially_paid',
            default => 'unpaid',
        };
        $order->save();
    }
    
    
    // In InvoiceController - Simplified recordPayment method
    
    
    // In InvoiceController - Use this recordPayment method
    
    public function recordPayment(Request $request, Invoice $invoice)
{
    $request->validate([
        'amount' => 'required|numeric|min:0.01',
        'method' => 'nullable|string',
        'note' => 'nullable|string',
    ]);

    return DB::transaction(function () use ($request, $invoice) {
        $paymentAmount = (float) $request->amount;

        // create invoice payment record (this makes the accessor sum increase)
        $payment = \Modules\Invoice\Models\InvoicePayment::create([
            'invoice_id' => $invoice->id,
            'payment_reference' => 'PAY-' . strtoupper(Str::random(8)),
            'staff_id' => auth()->id() ?? null,
            'amount' => $paymentAmount,
            'method' => $request->method ?? 'cash',
            'status' => 'completed',
            'note' => $request->note ?? null,
        ]);

        // Recompute paid amount via accessor and set invoice status (persist status only)
        $newPaidAmount = (float) $invoice->fresh()->paid_amount;
        $grandTotal = (float) $invoice->grand_total;

        $status = 'unpaid';
        if ($grandTotal > 0) {
            if ($newPaidAmount >= $grandTotal) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partially_paid';
            }
        }

        $invoice->status = $status;
        $invoice->save();

        $this->syncOrderPayment($invoice);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'invoice' => $invoice->fresh(['items', 'payments', 'order'])
        ], 200);
    });
}

public function refund(Request $request, Invoice $invoice)
{
    $request->validate([
        'amount' => 'required|numeric|min:0.01',
        'invoice_payment_id' => 'nullable|exists:invoice_payments,id',
        'reason' => 'nullable|string',
        'note' => 'nullable|string',
    ]);

    return DB::transaction(function () use ($request, $invoice) {
        $refundAmount = (float) $request->amount;

        // Option A: If a specific payment is provided, mark that payment (partial/full) as refunded.
        $invoicePaymentId = $request->invoice_payment_id;
        if ($invoicePaymentId) {
            $payment = \Modules\Invoice\Models\InvoicePayment::find($invoicePaymentId);
            if ($payment) {
                // If refund covers full payment, mark that payment refunded.
                // For more complex partial-refund logic you'd need refund-amount tracking per payment.
                $payment->status = 'refunded';
                $payment->save();
            }
        } else {
            // Option B: create a Refund record and (for simplicity) mark the oldest completed payment as refunded
            // until refundAmount is consumed — simple strategy for tests/demo.
            $remaining = $refundAmount;
            $payments = $invoice->payments()->where('status','completed')->orderBy('created_at','desc')->get();
            
            foreach ($payments as $p) {
    if ($remaining <= 0) break;

    if ($remaining >= $p->amount) {
        // Full refund for this payment
        $p->status = 'refunded';
        $remaining -= (float) $p->amount;
    } else {
        // Partial refund — reduce amount but keep it 'completed'
        $p->amount = $p->amount - $remaining;
        $remaining = 0;
    }
    $p->save();
}
        }

        // create refund record for audit
        \Modules\Invoice\Models\Refund::create([
            'invoice_id' => $invoice->id,
            'invoice_payment_id' => $invoicePaymentId ?? null,
            'amount' => $refundAmount,
            'staff_id' => auth()->id() ?? null,
            'reason' => $request->reason ?? null,
            'note' => $request->note ?? null,
            'status' => 'completed',
        ]);

        // Recompute status based on remaining completed payments
        $newPaidAmount = (float) $invoice->fresh()->paid_amount;
        $grandTotal = (float) $invoice->grand_total;

        $status = 'unpaid';
        if ($grandTotal > 0) {
            if ($newPaidAmount >= $grandTotal) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partially_paid';
            }
        }

        $invoice->status = $status;
        $invoice->save();

        $this->syncOrderPayment($invoice);

        return response()->json([
            'message' => 'Refund processed successfully',
            'invoice' => $invoice->fresh(['items', 'payments', 'order'])
        ], 200);
    });
}

/**
 * Create a new invoice by cloning an existing invoice.
 *
 * Example: POST /invoices/{invoiceId}/clone
 * Body (optional):
 *  - invoice_number, type, vat_percent, coupon_discount, status, items (override)
 *
 * Returns created invoice (201).
 */
public function createFromInvoice(Request $request, $invoiceId)
{
    // find the source invoice
    $source = Invoice::with('items')->findOrFail($invoiceId);

    // allow overrides from request
    $itemsOverride = $request->input('items'); // optional array to replace items
    $invoiceNumber = $request->input('invoice_number');
    $type = $request->input('type', $source->type ?? 'initial');
    $vatPercent = $request->input('vat_percent', $source->vat_percent ?? 0);
    $couponDiscount = $request->input('coupon_discount', $source->coupon_discount ?? 0);
    $status = $request->input('status', 'unpaid'); // default to unpaid for cloned invoice
    $paidAmount = $request->input('paid_amount', 0);

    // build payload
    $payload = [
        'order_id' => $source->order_id,
        'invoice_number' => $invoiceNumber ?? 'INV-'.\Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
        'type' => $type,
        'vat_percent' => $vatPercent,
        'coupon_discount' => $couponDiscount,
        'status' => $status,
        'paid_amount' => $paidAmount,
        'items' => [],
    ];

    if (is_array($itemsOverride) && !empty($itemsOverride)) {
        // use provided items override (must be array of items)
        $payload['items'] = $itemsOverride;
    } else {
        // copy items from source invoice
        $payload['items'] = $source->items->map(function ($it) {
            return [
                'service_id' => $it->service_id,
                'service_name' => $it->service_name,
                'description' => $it->description ?? null,
                'unit_price' => $it->unit_price,
                'quantity' => $it->quantity,
                'meta' => $it->meta ?? null,
            ];
        })->toArray();
    }

    // create new invoice via service (transaction handled there)
    $newInvoice = $this->invoiceService->createFromPayload($payload);

    // ensure order payment_status sync if linked
    if ($newInvoice) {
        $this->syncOrderPayment($newInvoice);
    }

    return response()->json(['invoice' => $newInvoice], 201);
}
    
public function downloadPdf(Invoice $invoice)
{
    $invoice->load(['items', 'order']);

    $pdf = Pdf::loadView('invoice::pdf.invoice', ['invoice' => $invoice]);

    return $pdf->download("Invoice-{$invoice->invoice_number}.pdf");
}
}