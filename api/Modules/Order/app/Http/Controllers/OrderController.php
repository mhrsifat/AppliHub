<?php

namespace Modules\Order\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Order\Http\Requests\StoreOrderRequest;
use Modules\Order\Http\Requests\UpdateOrderRequest;
use Modules\Order\Http\Requests\OrderItemRequest;
use Modules\Order\Transformers\OrderResource;
use Modules\Order\Transformers\OrderItemResource;
use Modules\Invoice\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    protected $invoiceController;

    public function __construct(InvoiceController $invoiceController)
    {
        $this->invoiceController = $invoiceController;
    }

    public function index(Request $request)
    {
        $query = Order::with('items')->orderByDesc('id');

        if ($request->has('q')) {
            $q = $request->get('q');
            $query->where(function ($qry) use ($q) {
                $qry->where('order_number', 'like', "%{$q}%")
                    ->orWhere('guest_name', 'like', "%{$q}%")
                    ->orWhere('guest_email', 'like', "%{$q}%")
                    ->orWhere('guest_phone', 'like', "%{$q}%")
                    ->orWhere('guest_address', 'like', "%{$q}%")
                    ->orWhere('coupon_code', 'like', "%{$q}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);

        return OrderResource::collection($query->paginate($perPage));
    }

    public function show($id)
    {
        $order = Order::with('items')->findOrFail($id);
        return new OrderResource($order);
    }

    // Staff/Admin creates order -> default unpaid + generate invoice
    public function store(StoreOrderRequest $request)
    {
        $data = $request->only([
            'customer_id',
            'guest_name',
            'guest_email',
            'guest_phone',
            'guest_address',
            'vat_percent',
            'coupon_code',
            'coupon_discount'
        ]);

        return DB::transaction(function () use ($request, $data) {
            $order = Order::create(array_merge($data, [
                'payment_status' => 'unpaid',
                'status' => 'pending',
                'coupon_discount' => $data['coupon_discount'] ?? 0,
                'created_by' => Auth::user()?->id ?? null,
            ]));

            $items = $request->get('items', []);
            foreach ($items as $i) {
                $order->items()->create([
                    'service_id' => $i['service_id'] ?? null,
                    'service_name' => $i['service_name'] ?? ($i['description'] ?? null),
                    'service_description' => $i['service_description'] ?? ($i['description'] ?? null),
                    'unit_price' => $i['unit_price'] ?? ($i['price'] ?? 0),
                    'quantity' => $i['quantity'] ?? 1,
                    'added_by' => Auth::user()?->id ?? null,
                ]);
            }

            $order->load('items');
            $order->total = $order->items->sum('total_price');
            $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
            $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
            $order->save();

            // create invoice automatically; returns an InvoiceResource (or response)
            $invoiceResponse = $this->invoiceController->createFromOrder($request, $order->id);

            $order->load('items');

            return response()->json([
                'order' => new OrderResource($order),
                'invoice' => $invoiceResponse->original ?? $invoiceResponse,
            ], 201);
        });
    }

    public function update(UpdateOrderRequest $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);

        $order->fill($request->only([
            'customer_id',
            'guest_name',
            'guest_email',
            'guest_phone',
            'guest_address',
            'vat_percent',
            'coupon_code',
            'coupon_discount',
            'status',
            'payment_status'
        ]));

        $order->save();

        if ($request->has('items')) {
            $items = $request->get('items');
            foreach ($items as $it) {
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
                        'added_by' => Auth::user()?->id ?? null,
                    ]);
                }
            }
        }

        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderResource($order->load('items'));
    }

    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Order deleted.']);
    }

    // add item to order
    public function addItem(OrderItemRequest $request, $orderId)
    {
        $order = Order::with('items')->findOrFail($orderId);

        $item = $order->items()->create(array_merge($request->validated(), [
            'added_by' => Auth::user()?->id ?? null,
        ]));

        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderItemResource($item);
    }

    // update item
    public function updateItem(OrderItemRequest $request, $orderId, $itemId)
    {
        $order = Order::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);

        $item->update($request->validated());

        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderItemResource($item);
    }

    // delete item
    public function deleteItem($orderId, $itemId)
    {
        $order = Order::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);
        $item->delete();

        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return response()->json(['message' => 'Item deleted']);
    }
}