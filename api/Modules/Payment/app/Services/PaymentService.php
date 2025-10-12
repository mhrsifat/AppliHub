<?php
namespace Modules\Payment\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Models\Payment;

class PaymentService
{
    protected $config;
    public function __construct()
    {
        $this->config = config('sslcommerz');
    }

    protected function baseUrl()
    {
        return $this->config['apiDomain'];
    }

    public function startPayment(Invoice $invoice, Payment $payment)
    {
        $post = [
            'store_id' => $this->config['store_id'],
            'store_passwd' => $this->config['store_password'],
            'total_amount' => (float)$invoice->grand_total,
            'currency' => 'BDT',
            'tran_id' => $payment->transaction_id,
            'success_url' => url($this->config['success_url']),
            'fail_url' => url($this->config['failed_url']),
            'cancel_url' => url($this->config['cancel_url']),
            'ipn_url' => url($this->config['ipn_url']),
            'cus_name' => $invoice->customer_name,
            'cus_email' => $invoice->customer_email,
            'cus_add1' => $invoice->customer_address,
            'cus_phone' => $invoice->customer_phone,
            'product_name' => 'Invoice #' . ($invoice->invoice_number ?? $invoice->id),
            'product_category' => 'service',
            'product_profile' => 'general',
        ];

        $url = $this->baseUrl() . $this->config['api']['make_payment'];

        $response = Http::asForm()->post($url, $post);
        $data = $response->json();

        $payment->raw_response = $data;
        $payment->save();

        if (!empty($data['GatewayPageURL'])) {
            return response()->json(['checkout_url' => $data['GatewayPageURL']]);
        }

        return response()->json(['message' => 'Failed to initiate payment'], 400);
    }

    public function handleSuccess($request)
    {
        $tranId = $request->tran_id;
        $payment = Payment::where('transaction_id', $tranId)->first();
        if (!$payment) return response('Invalid transaction', 400);

        $payment->status = 'completed';
        $payment->raw_response = $request->all();
        $payment->save();

        $invoice = $payment->invoice;
        $invoice->status = 'paid';
        $invoice->save();

        return redirect(config('app.frontend_url') . "/invoices/{$invoice->id}?payment=success");
    }

    public function handleFail($request)
    {
        $tranId = $request->tran_id;
        Payment::where('transaction_id', $tranId)->update(['status' => 'failed']);
        return redirect(config('app.frontend_url') . "/payment-failed");
    }

    public function handleCancel($request)
    {
        $tranId = $request->tran_id;
        Payment::where('transaction_id', $tranId)->update(['status' => 'cancelled']);
        return redirect(config('app.frontend_url') . "/payment-cancelled");
    }

    public function handleIpn($request)
    {
        Log::info('SSLCommerz IPN received', $request->all());
        return response('IPN OK', 200);
    }
}