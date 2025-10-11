<?php

namespace Modules\Order\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Order\Transformers\OrderResource;
use Modules\Order\Transformers\OrderItemResource;
use Modules\Invoice\Services\InvoiceService;
use Modules\Order\Http\Requests\StoreOrderRequest;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Http\Requests\OrderItemRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class OrderController extends Controller
{
    use AuthorizesRequests;
    protected InvoiceService $invoiceService;

    public function __construct(InvoiceService $invoiceService)
    {
        $this->invoiceService = $invoiceService;
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

    // Use Spatie hasRole() to check role properly
    if ($user && method_exists($user, 'hasRole') && $user->hasRole('employee')) {
        $query->where('assigned_to', $user->id);
    }

    // Search
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

  public function show($id)
{
    $order = Order::with('items')->findOrFail($id);
    $user = Auth::user();

    if ($user && method_exists($user, 'hasRole') && $user->hasRole('employee')) {
        // Employee cannot access unassigned or others' orders
        if (!$order->assigned_to || $order->assigned_to !== $user->id) {
            abort(403, 'Unauthorized to view this order');
        }
    }

    return new OrderResource($order);
}
    

    /**
     * Create an order and associated invoice.
     */
    public function store(StoreOrderRequest $request)
    {
        $data = $request->only([
            'customer_id', 'customer_name', 'customer_email', 'customer_phone', 'customer_address',
            'vat_percent', 'coupon_code', 'coupon_discount', 'items'
        ]);

        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? 'Guest',
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
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

        $order->fill($request->only([
            'customer_id', 'customer_name', 'customer_email', 'customer_phone', 'customer_address',
            'vat_percent', 'coupon_code', 'coupon_discount', 'status', 'payment_status'
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

        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderResource($order->fresh('items'));
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
     * Helper: recalculate totals + sync invoice
     */
    protected function recalculateOrder(Order $order)
    {
        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        if ($order->invoices()->exists()) {
            $latest = $order->invoices()->latest()->first();
            if ($latest) {
                $this->invoiceService->recalcAndRefresh($latest);
                $order->payment_status = match ($latest->status) {
                    'paid' => 'paid',
                    'partially_paid' => 'partially_paid',
                    default => $order->payment_status,
                };
                $order->save();
            }
        }
    }

    /**
     * Assign order to employee
     */
    public function assign(Request $request, $id)
    {
        $request->validate(['employee_id' => 'required|exists:users,id']);
        $order = Order::findOrFail($id);
        $this->authorize('assign', $order);

        $order->assigned_to = $request->employee_id;
        $order->save();

        if ($employee = \App\Models\User::find($request->employee_id)) {
            $employee->notify(new \Modules\Order\Notifications\OrderAssigned($order));
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
        $order->save();

        return response()->json(['message' => 'Order unassigned', 'order' => $order], 200);
    }
}