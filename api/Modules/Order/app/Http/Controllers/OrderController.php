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

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with('items')->orderByDesc('id');

        if ($request->has('q')) {
            $q = $request->get('q');
            $query->where(function ($qry) use ($q) {
                $qry->where('order_number', 'like', "%{$q}%")
                    ->orWhere('guest_name', 'like', "%{$q}%")
                    ->orWhere('guest_email', 'like', "%{$q}%")
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

    public function store(StoreOrderRequest $request)
    {
        $data = $request->only([
            'customer_id','guest_name','guest_email','vat_percent','coupon_code'
        ]);

        $order = Order::create($data);

        // add items
        $items = $request->get('items', []);
        foreach ($items as $i) {
            $order->items()->create([
                'service_id' => $i['service_id'] ?? null,
                'service_name' => $i['service_name'],
                'service_description' => $i['service_description'] ?? null,
                'unit_price' => $i['unit_price'],
                'quantity' => $i['quantity'],
                'added_by' => auth()->id() ?? null,
            ]);
        }

        // Recompute totals
        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        // coupon discount will be applied in Invoice module or via admin; keep as 0 here unless coupon logic added
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderResource($order->load('items'));
    }

    public function update(UpdateOrderRequest $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);

        // allow updates to shipping/customer and tax/coupon fields
        $order->fill($request->only([
            'customer_id','guest_name','guest_email','vat_percent','coupon_code','coupon_discount','status','payment_status'
        ]));

        // if VAT percent changed and items loaded, recalc
        $order->save();

        // if items were passed for a full replace (optional)
        if ($request->has('items')) {
            // expected items format: id (for existing) or no id (for new)
            $items = $request->get('items');
            foreach ($items as $it) {
                if (!empty($it['id'])) {
                    $item = $order->items()->find($it['id']);
                    if ($item) {
                        $item->update([
                            'service_id' => $it['service_id'] ?? $item->service_id,
                            'service_name' => $it['service_name'] ?? $item->service_name,
                            'service_description' => $it['service_description'] ?? $item->service_description,
                            'unit_price' => $it['unit_price'] ?? $item->unit_price,
                            'quantity' => $it['quantity'] ?? $item->quantity,
                        ]);
                    }
                } else {
                    $order->items()->create([
                        'service_id' => $it['service_id'] ?? null,
                        'service_name' => $it['service_name'],
                        'service_description' => $it['service_description'] ?? null,
                        'unit_price' => $it['unit_price'],
                        'quantity' => $it['quantity'],
                        'added_by' => auth()->id() ?? null,
                    ]);
                }
            }
        }

        // reload and recalc totals if items changed
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

    // Add an item (works pre/post payment)
    public function addItem(OrderItemRequest $request, $orderId)
    {
        $order = Order::with('items')->findOrFail($orderId);

        $item = $order->items()->create(array_merge($request->validated(), [
            'added_by' => auth()->id() ?? null,
        ]));

        // recalc
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderItemResource($item);
    }

    // Update an order item
    public function updateItem(OrderItemRequest $request, $orderId, $itemId)
    {
        $order = Order::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);

        $item->update($request->validated());

        // recalc order totals
        $order->load('items');
        $order->total = $order->items->sum('total_price');
        $order->vat_amount = round(($order->vat_percent / 100) * $order->total, 2);
        $order->grand_total = round($order->total + $order->vat_amount - $order->coupon_discount, 2);
        $order->save();

        return new OrderItemResource($item);
    }

    // Delete an item
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