<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use Modules\Employee\Models\Employee as EmployeeModel;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Order\Transformers\OrderResource;
use Modules\Order\Transformers\OrderItemResource;
use Modules\Invoice\Services\InvoiceService;
use Modules\Order\Http\Requests\StoreOrderRequest;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Http\Requests\OrderItemRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Invoice\Models\Refund;

class OrderController extends Controller
{
    use AuthorizesRequests;

    protected InvoiceService $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
    }

    /**
     * Helper: current authenticated user (guard already resolved by middleware)
     */
    protected function currentUser()
    {
        return Auth::user();
    }

    /**
     * List orders
     * Admin/manager: sees all
     * Employee: sees only assigned orders
     */
     public function index(Request $request)
{
    $query = Order::with('items')->orderByDesc('id');
    $user = Auth::user();

    if ($user->hasRole('employee')) {
        // Employee: Only orders assigned to them
        $query->where(function($q) use ($user) {
            $q->where('assigned_to', $user->id)
              ->where('assigned_type', 'employee');
        });
    } elseif (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
        // Admin: can see all orders
        // no filter needed
    } else {
        // Other users: see only orders assigned to them
        $query->where(function($q) use ($user) {
            $q->where('assigned_to', $user->id)
              ->where('assigned_type', 'user');
        });
    }

    if ($request->filled('q')) {
        $q = $request->get('q');
        $query->where(function ($qry) use ($q) {
            $qry->where('order_number', 'like', "%{$q}%")
                ->orWhere('customer_name', 'like', "%{$q}%")
                ->orWhere('customer_email', 'like', "%{$q}%")
                ->orWhere('customer_phone', 'like', "%{$q}%")
                ->orWhere('customer_address', 'like', "%{$q}%")
                ->orWhere('coupon_code', 'like', "%{$q}%");
        });
    }

    $perPage = (int) $request->get('per_page', 15);
    return OrderResource::collection($query->paginate($perPage));
}
    

    /**
     * Show single order
     */
     public function show($id)
{
    $order = Order::with(['items', 'invoices.payments'])->findOrFail($id);
    $user = Auth::user();

    if ($user && method_exists($user, 'hasRole')) {
        if ($user->hasRole('employee')) {
            // Employee: only if assigned to them
            if ($order->assigned_type !== 'employee' || $order->assigned_to !== $user->id) {
                abort(403, 'Unauthorized to view this order');
            }
        } elseif (!$user->hasRole('admin')) {
            // Regular user: only if assigned to them
            if ($order->assigned_type !== 'user' || $order->assigned_to !== $user->id) {
                abort(403, 'Unauthorized to view this order');
            }
        }
        // Admin: can view all
    }

    return new OrderResource($order);
}
    

    /**
     * Create an order and associated invoice
     */
    public function store(StoreOrderRequest $request)
    {
        $data = $request->only([
            'customer_id',
            'customer_name',
            'customer_email',
            'customer_phone',
            'customer_address',
            'customer_note',
            'vat_percent',
            'coupon_code',
            'coupon_discount',
            'items'
        ]);

        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? 'Guest',
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'customer_note' => $data['customer_note'] ?? null,
                'vat_percent' => $data['vat_percent'] ?? 0,
                'coupon_code' => $data['coupon_code'] ?? null,
                'coupon_discount' => $data['coupon_discount'] ?? 0,
                'payment_status' => 'unpaid',
                'status' => 'pending',
                'created_by' => Auth::id(),
            ]);

            $items = $data['items'] ?? [];
            if (!is_array($items)) {
                throw new \InvalidArgumentException('items must be an array');
            }

            foreach ($items as $i) {
                $order->items()->create([
                    'service_id' => $i['service_id'] ?? null,
                    'service_name' => $i['service_name'] ?? ($i['description'] ?? null),
                    'service_description' => $i['service_description'] ?? ($i['description'] ?? null),
                    'unit_price' => $i['unit_price'] ?? ($i['price'] ?? 0),
                    'quantity' => $i['quantity'] ?? 1,
                    'added_by' => Auth::id(),
                ]);
            }

            $order->load('items');
            $order->total = $order->items->sum('total_price');
            $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
            $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
            $order->save();

            // Create invoice
            $invoicePayload = [
                'order_id' => $order->id,
                'vat_percent' => $order->vat_percent,
                'coupon_discount' => $order->coupon_discount,
                'items' => $order->items->map(function ($it) {
                    return [
                        'service_id' => $it->service_id,
                        'service_name' => $it->service_name,
                        'description' => $it->service_description,
                        'unit_price' => $it->unit_price,
                        'quantity' => $it->quantity,
                        'meta' => null,
                    ];
                })->toArray(),
            ];

            $invoice = $this->invoiceService->createFromPayload($invoicePayload);

            $order->payment_status = $invoice->status === 'paid'
                ? 'paid'
                : ($invoice->status === 'partially_paid' ? 'partially_paid' : $order->payment_status);
            $order->save();

            return response()->json([
                'order' => new OrderResource($order->fresh('items')),
                'invoice' => $invoice,
            ], 201);
        });
    }

    /**
     * Update order (including optional items payload)
     */
    public function update(UpdateOrderRequest $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);

        return DB::transaction(function () use ($request, $order) {
            $order->fill($request->only([
                'customer_id',
                'customer_name',
                'customer_email',
                'customer_phone',
                'customer_address',
                'customer_note',
                'vat_percent',
                'coupon_code',
                'coupon_discount',
                'status',
                'payment_status'
            ]));
            $order->save();

            if ($request->has('items')) {
                foreach ($request->get('items', []) as $it) {
                    if (!empty($it['id'])) {
                        $item = $order->items()->find($it['id']);
                        if ($item) {
                            $item->update([
                                'service_id' => $it['service_id'] ?? $item->service_id,
                                'service_name' => $it['service_name'] ?? ($it['description'] ?? $item->service_name),
                                'service_description' => $it['service_description'] ?? ($it['description'] ?? $item->service_description),
                                'unit_price' => $it['unit_price'] ?? ($it['price'] ?? $item->unit_price),
                                'quantity' => $it['quantity'] ?? $item->quantity,
                            ]);
                        }
                    } else {
                        $order->items()->create([
                            'service_id' => $it['service_id'] ?? null,
                            'service_name' => $it['service_name'] ?? ($it['description'] ?? null),
                            'service_description' => $it['service_description'] ?? ($it['description'] ?? null),
                            'unit_price' => $it['unit_price'] ?? ($it['price'] ?? 0),
                            'quantity' => $it['quantity'] ?? 1,
                            'added_by' => Auth::id(),
                        ]);
                    }
                }
            }

            $this->recalculateOrder($order);

            return new OrderResource($order->fresh('items'));
        });
    }

    /**
     * Delete order
     */
    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Order deleted.']);
    }

    /**
     * Add item to order
     */
    public function addItem(OrderItemRequest $request, $orderId)
    {
        $order = Order::with('items')->findOrFail($orderId);

        $item = $order->items()->create(array_merge($request->validated(), [
            'added_by' => Auth::id(),
        ]));

        $this->recalculateOrder($order);

        return new OrderItemResource($item);
    }

    /**
     * Update order item
     */
    public function updateItem(OrderItemRequest $request, $orderId, $itemId)
    {
        $order = Order::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);

        $item->update($request->validated());
        $this->recalculateOrder($order);

        return new OrderItemResource($item);
    }

    /**
     * Delete order item
     */
    public function deleteItem($orderId, $itemId)
    {
        $order = Order::findOrFail($orderId);
        $order->items()->findOrFail($itemId)->delete();

        $this->recalculateOrder($order);

        return response()->json(['message' => 'Item deleted']);
    }

    /**
     * Helper: recalculate order totals and sync with invoices
     */
    protected function recalculateOrder(Order $order)
    {
        $order->load('items', 'invoices.payments');

        // Recalculate order totals from items
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        // Sync payment status from invoices if they exist
        if ($order->invoices()->exists()) {
            $this->syncOrderPaymentStatusFromInvoices($order);
        }
    }

    /**
     * Sync order payment status based on all invoices
     */
    protected function syncOrderPaymentStatusFromInvoices(Order $order)
    {
        $allInvoices = $order->invoices()->with('payments')->get();

        if ($allInvoices->isEmpty()) {
            $order->payment_status = 'unpaid';
            $order->save();
            return;
        }

        $allPaid = true;
        $anyPartialOrPaid = false;

        foreach ($allInvoices as $invoice) {
            // Calculate paid amount for this invoice
            $paidAmount = (float) $invoice->payments()
                ->where('status', 'completed')
                ->sum('amount');

            $grandTotal = (float) $invoice->grand_total;

            if ($grandTotal > 0) {
                if ($paidAmount < $grandTotal) {
                    $allPaid = false;
                }
                if ($paidAmount > 0) {
                    $anyPartialOrPaid = true;
                }
            }
        }

        // Determine order payment status
        if ($allPaid && $allInvoices->count() > 0) {
            $newStatus = 'paid';
        } elseif ($anyPartialOrPaid) {
            $newStatus = 'partially_paid';
        } else {
            $newStatus = 'unpaid';
        }

        if ($order->payment_status !== $newStatus) {
            $order->payment_status = $newStatus;
            $order->save();
        }
    }
/**
 * Assign order to employee or user
 */
public function assign(Request $request, $id)
{
    $request->validate([
        'employee_id' => 'required|integer',
        'employee_type' => 'required|string|in:user,employee'
    ]);

    $order = Order::findOrFail($id);
    $this->authorize('assign', $order);

    $order->assigned_to = $request->employee_id;
    $order->assigned_type = $request->employee_type;
    $order->save();

    // Notify the assignee
    if ($request->employee_type === 'user') {
        $modelClass = \App\Models\User::class;
    } else {
        $modelClass = \Modules\Employee\Models\Employee::class;
    }

    if ($assignee = $modelClass::find($request->employee_id)) {
        $assignee->notify(new \Modules\Order\Notifications\OrderAssigned($order));
    }

    return response()->json(['message' => 'Order assigned', 'order' => $order], 200);
}

/**
 * Unassign order
 */
public function unassign(Request $request, $id)
{
    $order = Order::findOrFail($id);
    $this->authorize('assign', $order);

    $order->assigned_to = null;
    $order->assigned_type = null;
    $order->save();

    return response()->json(['message' => 'Order unassigned', 'order' => $order], 200);
}
    

    /**
     * Public tracking method with payment carryover calculation
     * Query param: q (required) - can be order_number, invoice_number, email, or phone
     */
    public function publicTrack(Request $request)
    {
        $request->validate(['q' => 'required|string']);
        $q = trim($request->q);

        // Try find by order_number
        $order = Order::with(['items', 'invoices' => function ($iq) {
            $iq->with(['items', 'payments']);
        }])->where('order_number', $q)->first();

        // Fallback: find by invoice_number
        if (!$order) {
            $invoice = \Modules\Invoice\Models\Invoice::with(['items', 'payments', 'order'])
                ->where('invoice_number', $q)
                ->first();

            if ($invoice && $invoice->order) {
                $order = $invoice->order->loadMissing(['items', 'invoices.items', 'invoices.payments']);
            } elseif ($invoice) {
                // Invoice without order - return just the invoice
                $invoicePayload = new \Modules\Invoice\Transformers\InvoiceResource($invoice);
                $summary = $this->buildTrackSummary(null, collect([$invoice]));

                return response()->json([
                    'order' => null,
                    'invoices' => [$invoicePayload],
                    'summary' => $summary,
                    'pay_options' => [
                        'sslcommerz' => ['enabled' => true],
                        'bkash' => ['enabled' => false],
                        'nagad' => ['enabled' => false],
                    ],
                ]);
            }
        }

        if (!$order) {
            // Try by customer email or phone
            $order = Order::with(['items', 'invoices' => function ($iq) {
                $iq->with(['items', 'payments']);
            }])->where(function ($w) use ($q) {
                $w->where('customer_email', $q)
                    ->orWhere('customer_phone', $q);
            })->orderByDesc('id')->first();
        }

        if (!$order) {
            return response()->json([
                'message' => 'Not found. Please check order/invoice number or email/phone.'
            ], 404);
        }

        // Build response
        $invoices = $order->invoices()->with(['items', 'payments'])->orderByDesc('created_at')->get();
        $orderResource = new \Modules\Order\Transformers\OrderResource($order);
        $invoiceResources = \Modules\Invoice\Transformers\InvoiceResource::collection($invoices);
        $summary = $this->buildTrackSummary($order, $invoices);

        // Calculate available credit/carryover
        $carryover = $this->calculateOrderCarryover($order);

        return response()->json([
            'order' => $orderResource,
            'invoices' => $invoiceResources,
            'summary' => $summary,
            'carryover_credit' => $carryover,
            'pay_options' => [
                'sslcommerz' => ['enabled' => true],
                'bkash' => ['enabled' => false],
                'nagad' => ['enabled' => false],
            ],
        ]);
    }

    /**
     * Helper to build totals summary for tracking
     */
    protected function buildTrackSummary($order = null, $invoices)
    {
        $totalPayable = 0.0;
        $totalPaid = 0.0;

        foreach ($invoices as $inv) {
            $totalPayable += (float) ($inv->grand_total ?? 0);

            // Use the accessor or calculate from payments
            if (method_exists($inv, 'getPaidAmountAttribute')) {
                $paid = (float) $inv->paid_amount;
            } else {
                $paid = (float) $inv->payments()
                    ->where('status', 'completed')
                    ->sum('amount');
            }

            $totalPaid += $paid;
        }

        $totalDue = max(0, $totalPayable - $totalPaid);

        return [
            'total_payable' => round($totalPayable, 2),
            'total_paid' => round($totalPaid, 2),
            'total_due' => round($totalDue, 2),
        ];
    }

    /**
     * Calculate carryover credit for an order
     * Returns excess payment that hasn't been applied to any invoice
     */
       protected function calculateOrderCarryover(Order $order): float
    {
        $invoices = $order->invoices()->with('payments')->get();

        // Total invoiced amount
        $totalInvoiced = $invoices->sum(function ($inv) {
            return (float) ($inv->grand_total ?? 0);
        });

        // Total paid across all invoices
        $totalPaid = 0.0;
        foreach ($invoices as $inv) {
            $totalPaid += (float) $inv->payments()
                ->where('status', 'completed')
                ->sum('amount');
        }

        // Carryover is excess payment
        $carryover = $totalPaid - $totalInvoiced;

        return max(0, round($carryover, 2));
    }
    
    
    public function getFullOrderDetails(Request $request, $orderId)
{
    $order = Order::with([
        'items',
        'assignedTo:id,first_name,last_name,email,phone,avatar,location,full_address,status',
        'invoices.items',
        'invoices.payments',
        'invoices.refunds',
    ])->findOrFail($orderId);

    // Build assigned employee info
    $assignedEmployee = null;
    if ($order->assignedTo) {
        $assignedEmployee = [
            'id' => $order->assignedTo->id,
            'name' => trim($order->assignedTo->first_name . ' ' . $order->assignedTo->last_name),
            'email' => $order->assignedTo->email,
            'phone' => $order->assignedTo->phone,
            'avatar' => $order->assignedTo->avatar,
            'location' => $order->assignedTo->location,
            'full_address' => $order->assignedTo->full_address,
            'status' => $order->assignedTo->status,
        ];
    }

    // Prepare invoice items index (by service_id if present, otherwise by normalized service_name).
    $invoiceItemsIndex = collect(); // key => ['service_name'=>..., 'quantity'=>float, 'unit_price'=>float, 'line_total'=>float]
    foreach ($order->invoices as $inv) {
        foreach ($inv->items as $iit) {
            $serviceIdKey = $iit->service_id ? 'id_' . $iit->service_id : null;
            $nameKey = 'name_' . mb_strtolower(trim((string) $iit->service_name));

            $entry = [
                'service_name' => $iit->service_name,
                'quantity' => (float) $iit->quantity,
                'unit_price' => (float) $iit->unit_price,
                'line_total' => (float) $iit->line_total,
            ];

            // merge into index (sum quantities & line_totals if same key repeats)
            if ($serviceIdKey) {
                if ($invoiceItemsIndex->has($serviceIdKey)) {
                    $existing = $invoiceItemsIndex->get($serviceIdKey);
                    $invoiceItemsIndex->put($serviceIdKey, [
                        'service_name' => $existing['service_name'],
                        'quantity' => $existing['quantity'] + $entry['quantity'],
                        'unit_price' => $entry['unit_price'] ?: $existing['unit_price'],
                        'line_total' => $existing['line_total'] + $entry['line_total'],
                    ]);
                } else {
                    $invoiceItemsIndex->put($serviceIdKey, $entry);
                }
            }

            // always index by name as fallback
            if ($invoiceItemsIndex->has($nameKey)) {
                $existing = $invoiceItemsIndex->get($nameKey);
                $invoiceItemsIndex->put($nameKey, [
                    'service_name' => $existing['service_name'],
                    'quantity' => $existing['quantity'] + $entry['quantity'],
                    'unit_price' => $entry['unit_price'] ?: $existing['unit_price'],
                    'line_total' => $existing['line_total'] + $entry['line_total'],
                ]);
            } else {
                $invoiceItemsIndex->put($nameKey, $entry);
            }
        }
    }

    // Build invoices array and invoice summary
    $invoiceSummary = [
        'total_invoice_amount' => 0.0,
        'total_paid' => 0.0,
        'total_refunded' => 0.0,
        'total_due' => 0.0,
    ];

    $invoices = $order->invoices->map(function ($inv) use (&$invoiceSummary) {
        $paid = $inv->payments->where('status', 'completed')->sum('amount');
        $refunded = $inv->refunds->sum('amount');
        $netPaid = max(0, $paid - $refunded);
        $due = max(0, (float)$inv->grand_total - $netPaid);

        $invoiceSummary['total_invoice_amount'] += (float)$inv->grand_total;
        $invoiceSummary['total_paid'] += (float)$paid;
        $invoiceSummary['total_refunded'] += (float)$refunded;
        $invoiceSummary['total_due'] += (float)$due;

        return [
            'id' => $inv->id,
            'invoice_number' => $inv->invoice_number,
            'status' => $inv->status,
            'grand_total' => (float) $inv->grand_total,
            'paid' => (float) $paid,
            'refunded' => (float) $refunded,
            'due' => (float) $due,
            'items' => $inv->items->map(function ($it) {
                $computed = round(((float)$it->unit_price * (float)$it->quantity), 2);
                return [
                    'id' => $it->id,
                    'service_name' => $it->service_name,
                    'quantity' => (float)$it->quantity,
                    'unit_price' => (float)$it->unit_price,
                    'line_total' => (float) ($it->line_total ?? $computed),
                ];
            }),
        ];
    });

    // Build order items output: prefer item's own line_total, else try to use invoice data by service_id/name, else compute unit_price * quantity
    $itemsOut = $order->items->map(function ($it) use ($invoiceItemsIndex) {
        $computed = round(((float)$it->unit_price * (float)$it->quantity), 2);

        $match = null;
        if (!empty($it->service_id)) {
            $serviceKey = 'id_' . $it->service_id;
            if ($invoiceItemsIndex->has($serviceKey)) {
                $match = $invoiceItemsIndex->get($serviceKey);
            }
        }

        if (!$match) {
            $nameKey = 'name_' . mb_strtolower(trim((string)$it->service_name));
            if ($invoiceItemsIndex->has($nameKey)) {
                $match = $invoiceItemsIndex->get($nameKey);
            }
        }

        $lineTotal = null;
        if ($match) {
            $lineTotal = (float)$match['line_total'];
        } elseif (!empty($it->line_total) && (float)$it->line_total > 0) {
            $lineTotal = (float)$it->line_total;
        } else {
            $lineTotal = $computed;
        }

        return [
            'id' => $it->id,
            'service_id' => $it->service_id,
            'service_name' => $it->service_name,
            'description' => $it->description,
            'unit_price' => (float) $it->unit_price,
            'quantity' => (float) $it->quantity,
            'line_total' => (float) $lineTotal,
        ];
    });

    // Recompute order totals from itemsOut to ensure consistency with returned items/invoices
    $calculatedTotal = $itemsOut->sum(function ($it) {
        return (float) ($it['line_total'] ?? 0);
    });

    $vatAmount = round(($order->vat_percent / 100) * $calculatedTotal, 2);
    $grandTotalCalc = round($calculatedTotal + $vatAmount - (float)$order->coupon_discount, 2);

    // Return payload with same shape as before, but corrected/calculated numbers
    return response()->json([
        'order' => [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'customer_address' => $order->customer_address,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            // use recalculated totals to avoid zero/mismatch
            'total' => (float) $calculatedTotal,
            'vat_percent' => (float) $order->vat_percent,
            'vat_amount' => (float) $vatAmount,
            'coupon_discount' => (float) $order->coupon_discount,
            'grand_total' => (float) $grandTotalCalc,
            'created_at' => $order->created_at,
        ],
        'items' => $itemsOut,
        'assigned_employee' => $assignedEmployee,
        'invoices' => $invoices,
        'summary' => [
            // ensure rounding & consistent keys
            'total_invoice_amount' => round($invoiceSummary['total_invoice_amount'], 2),
            'total_paid' => round($invoiceSummary['total_paid'], 2),
            'total_refunded' => round($invoiceSummary['total_refunded'], 2),
            'total_due' => round($invoiceSummary['total_due'], 2),
        ],
    ]);
}
}
