<?php

namespace Modules\Invoice\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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
    // list invoices (paginated)
    public function index(Request $request)
    {
        $q = Invoice::with(['items','payments','refunds','order'])
               ->orderBy('created_at','desc');

        if ($request->filled('order_id')) {
            $q->where('order_id', $request->order_id);
        }

        return InvoiceResource::collection($q->paginate(25));
    }

    // show
    public function show(Invoice $invoice)
    {
        $invoice->load(['items','payments','refunds','order']);
        return new InvoiceResource($invoice);
    }

    // create invoice (from order or custom payload)
    public function store(StoreInvoiceRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // simple invoice_number generator - use your own generator for production
            $invoiceNumber = $data['invoice_number'] ?? 'INV-' . strtoupper(Str::random(8));

            $invoice = Invoice::create([
                'order_id' => $data['order_id'],
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

            // vat and grand total calculations
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $coupon = (float) ($invoice->coupon_discount ?? 0);

            $grandTotal = round($subtotal + $vatAmount - $coupon, 2);
            if ($grandTotal < 0) $grandTotal = 0;

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => $grandTotal,
            ]);

            return new InvoiceResource($invoice->fresh(['items','payments']));
        });
    }

    // update invoice (items may be edited before or after payment; maintain audit)
    public function update(Request $request, Invoice $invoice)
    {
        // Basic update for status/metadata; to update items use focused endpoints
        $payload = $request->only(['status','meta','vat_percent','coupon_discount']);
        if (isset($payload['vat_percent'])) $invoice->vat_percent = $payload['vat_percent'];
        if (isset($payload['coupon_discount'])) $invoice->coupon_discount = $payload['coupon_discount'];
        if (isset($payload['status'])) $invoice->status = $payload['status'];
        if (isset($payload['meta'])) $invoice->meta = $payload['meta'];

        // If vat or coupon changed, recalc totals from items:
        if (isset($payload['vat_percent']) || isset($payload['coupon_discount'])) {
            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);
            $invoice->subtotal = $subtotal;
            $invoice->vat_amount = $vatAmount;
            $invoice->grand_total = max(0, $grandTotal);
        }

        $invoice->save();

        // update status based on payments
        $paid = $invoice->payments()->where('status','completed')->sum('amount');
        if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
            $invoice->status = 'paid';
            $invoice->save();
        } elseif ($paid > 0) {
            $invoice->status = 'partially_paid';
            $invoice->save();
        }

        return new InvoiceResource($invoice->fresh(['items','payments','refunds']));
    }

    // add item (works even after payment; staff should control permission)
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

            // recalc totals
            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => max(0, $grandTotal),
            ]);

            // update invoice status based on payments
            $paid = $invoice->payments()->where('status','completed')->sum('amount');
            if ($paid >= $invoice->grand_total) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            }

            return response()->json([
                'item' => $it,
                'invoice' => $invoice->fresh(['items','payments']),
            ], 201);
        });
    }

    // update item
    public function updateItem(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        $this->validate($request, [
            'unit_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'service_name' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message'=>'mismatch'], 422);
        }

        return DB::transaction(function () use ($request, $invoice, $item) {
            $item->fill($request->only(['service_name','description','unit_price','quantity','meta']));
            if ($request->filled('unit_price') || $request->filled('quantity')) {
                $item->line_total = round($item->unit_price * $item->quantity, 2);
            }
            $item->save();

            // recalc invoice totals
            $subtotal = $invoice->items()->sum(DB::raw('unit_price * quantity'));
            $vatAmount = round($subtotal * (($invoice->vat_percent ?? 0) / 100), 2);
            $grandTotal = round($subtotal + $vatAmount - ($invoice->coupon_discount ?? 0), 2);

            $invoice->update([
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'grand_total' => max(0, $grandTotal),
            ]);

            // update status (paid / partially paid) if needed
            $paid = $invoice->payments()->where('status','completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            }

            return response()->json($invoice->fresh(['items','payments']));
        });
    }

    // remove item
    public function removeItem(Request $request, Invoice $invoice, InvoiceItem $item)
    {
        if ($item->invoice_id !== $invoice->id) {
            return response()->json(['message'=>'mismatch'], 422);
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

            // update status by payments
            $paid = $invoice->payments()->where('status','completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
                $invoice->save();
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
                $invoice->save();
            } else {
                // keep status if refunded/cancelled else set to issued
                if (!in_array($invoice->status, ['refunded','cancelled'])) {
                    $invoice->status = 'issued';
                    $invoice->save();
                }
            }

            return response()->json($invoice->fresh(['items','payments']));
        });
    }

    // record a payment (supports partials)
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

            // update invoice status
            $paid = $invoice->payments()->where('status','completed')->sum('amount');
            if ($paid >= $invoice->grand_total && $invoice->grand_total > 0) {
                $invoice->status = 'paid';
            } elseif ($paid > 0) {
                $invoice->status = 'partially_paid';
            }
            $invoice->save();

            return response()->json([
                'payment' => $payment,
                'invoice' => $invoice->fresh(['payments','items'])
            ], 201);
        });
    }

    // refund (partial or full)
    public function refund(RefundRequest $request, Invoice $invoice)
    {
        return DB::transaction(function () use ($request, $invoice) {
            $data = $request->validated();

            $amount = $data['amount'];
            // check available refundable amount (paid - already refunded)
            $paid = $invoice->payments()->where('status','completed')->sum('amount');
            $alreadyRefunded = $invoice->refunds()->where('status','completed')->sum('amount');
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

            // mark related payment if present
            if (!empty($data['invoice_payment_id'])) {
                $pay = $invoice->payments()->find($data['invoice_payment_id']);
                if ($pay) {
                    $pay->status = 'refunded';
                    $pay->save();
                }
            }

            // if full refund of invoice, change invoice status
            $totalRefunded = $invoice->refunds()->where('status','completed')->sum('amount');
            if ($totalRefunded >= $invoice->paid_amount && $invoice->paid_amount > 0) {
                $invoice->status = 'refunded';
            }
            $invoice->save();

            return response()->json([
                'refund' => $refund,
                'invoice' => $invoice->fresh(['payments','refunds']),
            ], 201);
        });
    }

    // generate an additional invoice for an order (helper)
    public function createFromOrder(Request $request, $orderId)
    {
        // Implementation depends on your order_items table structure.
        // Here, we assume order_items available and copy them
        $order = \App\Models\Order::with('items')->findOrFail($orderId);

        $items = $order->items->map(function($oi){
            return [
                'service_id' => $oi->service_id ?? null,
                'service_name' => $oi->service_name ?? $oi->name ?? 'Service',
                'description' => $oi->description ?? null,
                'unit_price' => $oi->unit_price,
                'quantity' => $oi->quantity,
            ];
        })->toArray();

        $req = new \Illuminate\Http\Request();
        $req->replace([
            'order_id' => $order->id,
            'type' => 'initial',
            'vat_percent' => $order->vat_percent ?? 0,
            'coupon_discount' => $order->coupon_discount ?? 0,
            'items' => $items,
        ]);

        $storeReq = app(StoreInvoiceRequest::class);
        $storeReq->setContainer(app())->setRedirector(app('redirect'));
        $storeReq->initialize();

        return $this->store($req);
    }
}