<?php
// filepath: Modules/Invoice/Http/Controllers/InvoiceController.php

namespace Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoiceItem;
use Modules\Invoice\Models\InvoicePayment;
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

    public function index(Request $request)
    {
        $q = Invoice::with(['items', 'payments', 'refunds', 'order'])->orderBy('created_at', 'desc');

        if ($request->filled('order_id')) {
            $q->where('order_id', $request->order_id);
        }

        // If the authenticated user is an employee, restrict invoices to only
        // those whose orders are assigned to that employee.
        $user = Auth::user();
        if ($user && $user->roles()->where('name', 'employee')->exists()) {
            $q->whereHas('order', function ($oq) use ($user) {
                $oq->where('assigned_to', $user->id);
            });
        }

        return InvoiceResource::collection($q->paginate(25));
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['items', 'payments', 'refunds', 'order']);
        return new InvoiceResource($invoice);
    }

    public function store(Request $request)
    {
        $data = $request instanceof StoreInvoiceRequest ? $request->validated() : $request->all();
        $invoice = $this->invoiceService->createFromPayload($data);

        $this->syncOrderPaymentStatus($invoice);

        return new InvoiceResource($invoice);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $payload = $request->only(['status', 'meta', 'vat_percent', 'coupon_discount']);

        $invoice->fill($payload);
        $invoice->save();

        $invoice = $this->invoiceService->recalcAndRefresh($invoice);

        $this->syncOrderPaymentStatus($invoice);

        return new InvoiceResource($invoice->fresh(['items', 'payments', 'refunds', 'order']));
    }

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
            $item = $invoice->items()->create([
                'service_id' => $validated['service_id'] ?? null,
                'service_name' => $validated['service_name'],
                'description' => $validated['description'] ?? null,
                'unit_price' => (float) $validated['unit_price'],
                'quantity' => (int) $validated['quantity'],
                'line_total' => round((float)$validated['unit_price'] * (int)$validated['quantity'], 2),
                'meta' => $validated['meta'] ?? null,
            ]);

            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'item' => $item,
                'invoice' => $invoice->fresh(['items', 'payments', 'order']),
            ], 201);
        });
    }

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
            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'item' => $item,
                'invoice' => $invoice->fresh(['items', 'payments', 'order']),
            ], 200);
        });
    }

    public function deleteItem(Invoice $invoice, InvoiceItem $item)
    {
        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message' => 'mismatch'], 422);
        }

        return DB::transaction(function () use ($invoice, $item) {
            $item->delete();
            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'invoice' => $invoice->fresh(['items', 'payments', 'order']),
            ], 200);
        });
    }

    /**
     * Create invoice from order with automatic carryover
     */
    public function createFromOrder(Request $request, $orderId)
    {
        $order = Order::with(['items', 'invoices.payments'])->findOrFail($orderId);

        $items = $request->input('items');

        // If caller didn't provide explicit items, default to only the order items
        // that were added after the last invoice was created. This prevents the
        // new invoice from re-invoicing previously invoiced items.
        if (!is_array($items) || empty($items)) {
            $lastInvoice = $order->invoices()->orderByDesc('created_at')->first();

            $query = $order->items();
            if ($lastInvoice) {
                $query = $query->where('created_at', '>', $lastInvoice->created_at);
            }

            $newItems = $query->get();

            // If there are no new items to invoice, return a helpful error so
            // callers can either pass explicit items or avoid creating empty invoices.
            if ($newItems->isEmpty()) {
                return response()->json([
                    'message' => 'No new order items found to invoice. Provide items in request or add items to order first.'
                ], 422);
            }

            $items = $newItems->map(fn($it) => [
                'service_id' => $it->service_id,
                'service_name' => $it->service_name,
                'description' => $it->service_description ?? null,
                'unit_price' => $it->unit_price,
                'quantity' => $it->quantity,
                'meta' => $it->meta ?? null,
            ])->toArray();
        }

        return DB::transaction(function () use ($request, $order, $items) {
            $payload = [
                'order_id' => $order->id,
                'vat_percent' => $request->input('vat_percent', $order->vat_percent),
                'coupon_discount' => $request->input('coupon_discount', $order->coupon_discount),
                'invoice_number' => $request->input('invoice_number', 'INV-' . Str::upper(Str::random(8))),
                'type' => $request->input('type', 'initial'),
                'items' => $items,
            ];

            $invoice = $this->invoiceService->createFromPayload($payload);

            // use service-level carryover logic
            $carryoverAmount = $this->invoiceService->calculateCarryoverPayment($order, $invoice->id);

            if ($carryoverAmount > 0) {
                $applyAmount = min($carryoverAmount, (float) $invoice->grand_total);

                InvoicePayment::create([
                    'invoice_id' => $invoice->id,
                    'payment_reference' => 'CARRY-' . strtoupper(Str::random(8)),
                    'staff_id' => Auth::id() ?? null,
                    'amount' => $applyAmount,
                    'method' => 'adjustment',
                    'status' => 'completed',
                    'note' => 'Auto-applied carryover from previous payments',
                ]);

                $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            }

            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'invoice' => $invoice->fresh(['items', 'payments', 'order']),
                'carryover_applied' => $carryoverAmount > 0 ? $applyAmount : 0,
            ], 201);
        });
    }

    /**
     * Create invoice from another invoice (clone)
     */
    public function createFromInvoice(Request $request, $invoiceId)
    {
        $source = Invoice::with('items')->findOrFail($invoiceId);

        $itemsOverride = $request->input('items');
        $invoiceNumber = $request->input('invoice_number');
        $type = $request->input('type', $source->type ?? 'initial');
        $vatPercent = $request->input('vat_percent', $source->vat_percent ?? 0);
        $couponDiscount = $request->input('coupon_discount', $source->coupon_discount ?? 0);
        $status = $request->input('status', 'unpaid');

        $payload = [
            'order_id' => $source->order_id,
            'invoice_number' => $invoiceNumber ?? 'INV-' . Str::upper(Str::random(8)),
            'type' => $type,
            'vat_percent' => $vatPercent,
            'coupon_discount' => $couponDiscount,
            'status' => $status,
            'items' => [],
        ];

        if (is_array($itemsOverride) && !empty($itemsOverride)) {
            $payload['items'] = $itemsOverride;
        } else {
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

        $newInvoice = $this->invoiceService->createFromPayload($payload);

        if ($newInvoice && $newInvoice->order_id) {
            $order = Order::with(['invoices.payments'])->find($newInvoice->order_id);
            if ($order) {
                $carryoverAmount = $this->invoiceService->calculateCarryoverPayment($order, $newInvoice->id);

                if ($carryoverAmount > 0) {
                    $applyAmount = min($carryoverAmount, (float) $newInvoice->grand_total);

                    InvoicePayment::create([
                        'invoice_id' => $newInvoice->id,
                        'payment_reference' => 'CARRY-' . strtoupper(Str::random(8)),
                        'staff_id' => Auth::id() ?? null,
                        'amount' => $applyAmount,
                        'method' => 'adjustment',
                        'status' => 'completed',
                        'note' => 'Auto-applied carryover from previous payments',
                    ]);

                    $newInvoice = $this->invoiceService->recalcAndRefresh($newInvoice);
                }
            }

            $this->syncOrderPaymentStatus($newInvoice);
        }

        return response()->json(['invoice' => $newInvoice], 201);
    }

    /**
     * Record payment on invoice
     */
    public function recordPayment(Request $request, Invoice $invoice)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'nullable|string',
            'note' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $invoice) {
            $paymentAmount = (float) $request->amount;

            $payment = InvoicePayment::create([
                'invoice_id' => $invoice->id,
                'payment_reference' => 'PAY-' . strtoupper(Str::random(8)),
                'staff_id' => Auth::id() ?? null,
                'amount' => $paymentAmount,
                'method' => $request->method ?? 'cash',
                'status' => 'completed',
                'note' => $request->note ?? null,
            ]);

            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment,
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
            $invoicePaymentId = $request->invoice_payment_id;

            if ($invoicePaymentId) {
                $payment = InvoicePayment::find($invoicePaymentId);
                if ($payment && $payment->invoice_id === $invoice->id) {
                    if ($refundAmount >= $payment->amount) {
                        $payment->status = 'refunded';
                        $payment->save();
                    } else {
                        $payment->amount = $payment->amount - $refundAmount;
                        $payment->save();
                    }
                }
            } else {
                $remaining = $refundAmount;
                $payments = $invoice->payments()
                    ->where('status', 'completed')
                    ->orderBy('created_at', 'asc')
                    ->get();

                foreach ($payments as $p) {
                    if ($remaining <= 0) break;

                    if ($remaining >= $p->amount) {
                        $p->status = 'refunded';
                        $remaining -= (float) $p->amount;
                    } else {
                        $p->amount = $p->amount - $remaining;
                        $remaining = 0;
                    }
                    $p->save();
                }
            }

            \Modules\Invoice\Models\Refund::create([
                'invoice_id' => $invoice->id,
                'invoice_payment_id' => $invoicePaymentId ?? null,
                'amount' => $refundAmount,
                'staff_id' => Auth::id() ?? null,
                'reason' => $request->reason ?? null,
                'note' => $request->note ?? null,
                'status' => 'completed',
            ]);

            $invoice = $this->invoiceService->recalcAndRefresh($invoice);
            $this->syncOrderPaymentStatus($invoice);

            return response()->json([
                'message' => 'Refund processed successfully',
                'invoice' => $invoice->fresh(['items', 'payments', 'refunds', 'order'])
            ], 200);
        });
    }

    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load(['items', 'order']);
        $pdf = Pdf::loadView('invoice::pdf.invoice', ['invoice' => $invoice]);
        return $pdf->download("Invoice-{$invoice->invoice_number}.pdf");
    }

    /**
     * Sync order payment status based on all its invoices
     */
    protected function syncOrderPaymentStatus(Invoice $invoice): void
    {
        if (!$invoice->order_id) {
            return;
        }

        $order = Order::with(['invoices.payments'])->find($invoice->order_id);
        if (!$order) return;

        $allInvoices = $order->invoices;

        if ($allInvoices->isEmpty()) {
            $order->update(['payment_status' => 'unpaid']);
            return;
        }

        $allPaid = true;
        $anyPartialOrPaid = false;

        foreach ($allInvoices as $inv) {
            $paidAmount = (float) ($inv->paid_amount ?? 0);
            $grandTotal = (float) ($inv->grand_total ?? 0);

            if ($grandTotal > 0) {
                if ($paidAmount < $grandTotal) {
                    $allPaid = false;
                }
                if ($paidAmount > 0) {
                    $anyPartialOrPaid = true;
                }
            }
        }

        $newStatus = ($allPaid && $allInvoices->count() > 0) ? 'paid' : ($anyPartialOrPaid ? 'partially_paid' : 'unpaid');

        if ($order->payment_status !== $newStatus) {
            $order->update(['payment_status' => $newStatus]);
        }
    }
}
