<?php
namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Models\Payment;
use Modules\Payment\Services\PaymentService;

class PaymentController extends Controller
{
    protected PaymentService $service;

    public function __construct(PaymentService $service)
    {
        $this->service = $service;
    }

    public function initiate(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'gateway' => 'required|string',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'order_id' => $invoice->order_id,
            'gateway' => $request->gateway,
            'transaction_id' => 'TXN-' . Str::upper(Str::random(12)),
            'amount' => $invoice->grand_total,
            'status' => 'pending',
        ]);

        return $this->service->startPayment($invoice, $payment);
    }

    public function sslSuccess(Request $request)
    {
        return $this->service->handleSuccess($request);
    }

    public function sslFail(Request $request)
    {
        return $this->service->handleFail($request);
    }

    public function sslCancel(Request $request)
    {
        return $this->service->handleCancel($request);
    }

    public function sslIpn(Request $request)
    {
        return $this->service->handleIpn($request);
    }
}