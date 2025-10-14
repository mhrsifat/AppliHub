<?php

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

    /**
     * Helper: whether current user is admin
     */
    protected function userIsAdmin($user): bool
    {
        return $user && method_exists($user, 'hasRole') && $user->hasRole('admin');
    }

    /**
     * Helper: whether current user is employee (role)
     */
    protected function userIsEmployee($user): bool
    {
        return $user && method_exists($user, 'hasRole') && $user->hasRole('employee');
    }

    /**
     * Authorize creation of invoices (create permission)
     * Admin or Employee only
     */
    protected function authorizeCreate(): void
    {
        $user = Auth::user();
        if ($this->userIsAdmin($user)) {
            return;
        }
        if ($this->userIsEmployee($user)) {
            return;
        }
        abort(403, 'Unauthorized to create invoice.');
    }

    /**
     * Authorize modification actions on a given invoice:
     * - Admin always allowed
     * - Employee allowed only if order is assigned to them (considering assigned_type)
     * - If invoice has no order, only admin allowed
     */
    protected function authorizeModifyAccess(Invoice $invoice): void
    {
        $user = Auth::user();
        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        // Only employees may edit (apart from admins)
        if ($this->userIsEmployee($user) || $this->userIsAdmin($user)) {
            $order = $invoice->order;
            if (!$order) {
                // No order attached -> only admin could modify, so deny
                abort(403, 'Unauthorized to modify invoice without order.');
            }

            $assignedType = $order->assigned_type;
            $assignedTo = $order->assigned_to;

            // Case 1: order.assigned_type === 'employee'
            if ($assignedType === 'employee') {
                // Two common possibilities:
                // - assigned_to stores the users.id of the employee user
                // - OR assigned_to stores id from separate employees table
                if ($assignedTo === $user->id) {
                    return;
                }

                // If User has an employee relation (e.g. employeeProfile) check its id
                if (isset($user->employeeProfile) && $user->employeeProfile && $assignedTo === $user->employeeProfile->id) {
                    return;
                }

                // Also allow if user has 'employee' and assigned_to is numeric matching user's id (redundant)
                // otherwise deny
                abort(403, 'Unauthorized to modify invoice for this order.');
            }

            // Case 2: order.assigned_type === 'user' (assigned directly to a user)
            if ($assignedType === 'user') {
                if ($assignedTo === $user->id) {
                    return;
                }
                abort(403, 'Unauthorized to modify invoice for this order.');
            }

            // Other/unknown assigned_type -> deny for employees
            abort(403, 'Unauthorized to modify invoice.');
        }

        // Non-admin, non-employee cannot modify
        abort(403, 'Unauthorized to modify invoice.');
    }

    public function index(Request $request)
    {
        $q = Invoice::with(['items', 'payments', 'refunds', 'order'])->orderByDesc('created_at');

        $user = Auth::user();

        if ($user && method_exists($user, 'hasRole')) {
            if ($user->hasRole('employee')) {
                // Employee: only invoices where order assigned to them (and assigned_type = 'employee')
                $q->whereHas('order', function ($oq) use ($user) {
                    $oq->where('assigned_type', 'employee')
                       ->where(function ($sub) use ($user) {
                           $sub->where('assigned_to', $user->id);

                           // If user has an employeeProfile relation (separate employees table), allow that id too
                           if (isset($user->employeeProfile) && $user->employeeProfile) {
                               $sub->orWhere('assigned_to', $user->employeeProfile->id);
                           }
                       });
                });
            } elseif ($user->hasRole('admin')) {
                // Admin: no restriction
            } else {
                // Other users: show only invoices for orders assigned to them as 'user'
                $q->whereHas('order', function ($oq) use ($user) {
                    $oq->where('assigned_type', 'user')
                       ->where('assigned_to', $user->id);
                });
            }
        }

        if ($request->filled('order_id')) {
            $q->where('order_id', $request->order_id);
        }

        return InvoiceResource::collection($q->paginate(25));
    }

    public function show(Invoice $invoice)
    {
        // Viewing: allowed for everyone per your instruction
        $invoice->load(['items', 'payments', 'refunds', 'order']);
        return new InvoiceResource($invoice);
    }

    public function store(Request $request)
    {
        // Only admin or employee allowed to create
        $this->authorizeCreate();

        $data = $request instanceof StoreInvoiceRequest ? $request->validated() : $request->all();
        $invoice = $this->invoiceService->createFromPayload($data);

        $this->syncOrderPaymentStatus($invoice);

        return new InvoiceResource($invoice);
    }

    public function update(Request $request, Invoice $invoice)
    {
        // Only admin or assigned employee can update
        $this->authorizeModifyAccess($invoice);

        $payload = $request->only(['status', 'meta', 'vat_percent', 'coupon_discount']);

        $invoice->fill($payload);
        $invoice->save();

        $invoice = $this->invoiceService->recalcAndRefresh($invoice);

        $this->syncOrderPaymentStatus($invoice);

        return new InvoiceResource($invoice->fresh(['items', 'payments', 'refunds', 'order']));
    }

    public function addItem(Request $request, Invoice $invoice)
    {
        // Only admin or assigned employee can modify invoice items
        $this->authorizeModifyAccess($invoice);

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
        // Only admin or assigned employee can modify invoice items
        $this->authorizeModifyAccess($invoice);

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
        // Only admin or assigned employee can delete invoice items
        $this->authorizeModifyAccess($invoice);

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
     * Create invoice from another invoice (clone)
     */
    public function createFromInvoice(Request $request, $invoiceId)
    {
        $source = Invoice::with('items')->findOrFail($invoiceId);

        // Only admin or assigned employee can clone (because cloning is a create action)
        $this->authorizeModifyAccess($source);

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
        // Only admin or assigned employee can record payments
        $this->authorizeModifyAccess($invoice);

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
        // Only admin or assigned employee can process refunds
        $this->authorizeModifyAccess($invoice);

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
        // Viewing/downloading PDF: allowed for everyone per your instruction
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
    
    
     
 /** public function createFromOrder(Request $request, $orderId)
{
    $order = Order::with(['items'])->findOrFail($orderId);

    // allow caller to force include all items (back-compat)
    $forceIncludeAll = $request->boolean('include_all', false);

    $itemsInput = $request->input('items');

    // If explicit items provided, use them (caller override)
    if (is_array($itemsInput) && !empty($itemsInput)) {
        $items = $itemsInput;
    } else {
        if ($forceIncludeAll) {
            // include all order items as invoice line items
            $order->load('items');
            $items = $order->items->map(fn($it) => [
                'service_id' => $it->service_id,
                'service_name' => $it->service_name,
                'description' => $it->service_description ?? $it->description ?? null,
                'unit_price' => $it->unit_price,
                'quantity' => $it->quantity,
                'meta' => $it->meta ?? null,
            ])->toArray();
        } else {
            // compute remaining / uninvoiced quantities per order item
            $order->load('items');

            $items = [];
            foreach ($order->items as $it) {
                // compute already invoiced quantity for this order item
                $invoicedQtyQuery = \Modules\Invoice\Models\InvoiceItem::query()
                    ->whereHas('invoice', function ($q) use ($order) {
                        $q->where('order_id', $order->id);
                    });

                if (!empty($it->service_id)) {
                    // match by service_id primarily
                    $invoicedQtyQuery->where('service_id', $it->service_id);
                } else {
                    // fallback: match by service_name if service_id absent
                    $invoicedQtyQuery->where('service_name', $it->service_name);
                }

                $invoicedQty = (float) $invoicedQtyQuery->sum('quantity');

                $remainingQty = max(0, (float)$it->quantity - $invoicedQty);

                if ($remainingQty > 0) {
                    $items[] = [
                        'service_id' => $it->service_id,
                        'service_name' => $it->service_name,
                        'description' => $it->service_description ?? $it->description ?? null,
                        'unit_price' => $it->unit_price,
                        'quantity' => $remainingQty,
                        'meta' => $it->meta ?? null,
                    ];
                }
            }

            // If nothing remains to invoice, return helpful error rather than creating 0 invoice
            if (empty($items)) {
                return response()->json([
                    'message' => 'No uninvoiced order items found. Provide explicit items or set include_all=1 to invoice all items.'
                ], 422);
            }
        }
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

        // recalc carryover using current order invoices/payments
        $orderForCarry = Order::with(['invoices.payments'])->find($order->id);
        $carryoverAmount = $this->invoiceService->calculateCarryoverPayment($orderForCarry, $invoice->id);

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

        // Compute totals for response (clear labels)
        $totalBill = (float) ($invoice->grand_total ?? 0.0);
        $totalPaid = (float) $invoice->payments()->where('status', 'completed')->sum('amount');
        $totalDue = max(0.0, $totalBill - $totalPaid);
        $payable = $totalDue;

        return response()->json([
            'invoice' => $invoice->fresh(['items', 'payments', 'order']),
            'carryover_applied' => $carryoverAmount > 0 ? $applyAmount : 0,
            'summary' => [
                'total_bill' => round($totalBill, 2),
                'total_paid' => round($totalPaid, 2),
                'total_due' => round($totalDue, 2),
                'payable' => round($payable, 2),
            ],
        ], 201);
    });
} */

public function createFromOrder(Request $request, $orderId)
{
    $order = Order::with(['items'])->findOrFail($orderId);

    // allow caller to force include all items
    $forceIncludeAll = $request->boolean('include_all', false);
    $itemsInput = $request->input('items');

    // Determine which items to invoice
    if (is_array($itemsInput) && !empty($itemsInput)) {
        $items = $itemsInput; // caller override
    } else {
        $order->load('items');
        $items = [];

        foreach ($order->items as $it) {
            $invoicedQtyQuery = \Modules\Invoice\Models\InvoiceItem::query()
                ->whereHas('invoice', fn($q) => $q->where('order_id', $order->id));

            if (!empty($it->service_id)) {
                $invoicedQtyQuery->where('service_id', $it->service_id);
            } else {
                $invoicedQtyQuery->where('service_name', $it->service_name);
            }

            $invoicedQty = (float) $invoicedQtyQuery->sum('quantity');
            $remainingQty = max(0, (float)$it->quantity - $invoicedQty);

            // include all items if forced, else only remaining
            if ($forceIncludeAll || $remainingQty > 0) {
                $qtyToInvoice = $forceIncludeAll ? (float)$it->quantity : $remainingQty;

                $items[] = [
                    'service_id' => $it->service_id,
                    'service_name' => $it->service_name,
                    'description' => $it->service_description ?? $it->description ?? null,
                    'unit_price' => $it->unit_price,
                    'quantity' => $qtyToInvoice,
                    'line_total' => round($it->unit_price * $qtyToInvoice, 2),
                    'meta' => array_merge($it->meta ?? [], [
                        'order_item_id' => $it->id,
                        'invoiced_qty' => $invoicedQty,
                        'remaining_qty' => $remainingQty,
                    ]),
                ];
            }
        }

        if (empty($items)) {
            return response()->json([
                'message' => 'No uninvoiced order items found. Provide explicit items or set include_all=1.'
            ], 422);
        }
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

        // recalc carryover using current order invoices/payments
        $orderForCarry = Order::with(['invoices.payments'])->find($order->id);
        $carryoverAmount = $this->invoiceService->calculateCarryoverPayment($orderForCarry, $invoice->id);

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

        // Compute totals for response
        $totalBill = (float) ($invoice->grand_total ?? 0.0);
        $totalPaid = (float) $invoice->payments()->where('status', 'completed')->sum('amount');
        $totalDue = max(0.0, $totalBill - $totalPaid);
        $payable = $totalDue;

        return response()->json([
            'invoice' => $invoice->fresh(['items', 'payments', 'order']),
            'carryover_applied' => $carryoverAmount > 0 ? $applyAmount : 0,
            'summary' => [
                'total_bill' => round($totalBill, 2),
                'total_paid' => round($totalPaid, 2),
                'total_due' => round($totalDue, 2),
                'payable' => round($payable, 2),
            ],
        ], 201);
    });
}
}
