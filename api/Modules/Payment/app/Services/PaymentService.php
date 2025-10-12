<?php

namespace Modules\Payment\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Payment\Models\Payment;

class PaymentService
{
    protected $config;
    public function __construct()
    {
        $this->config = config('sslcommerz') ?? [];

        // Provide sane defaults for development if config is missing
        $defaults = [
            'store_id' => env('SSLCOMMERZ_STORE_ID', ''),
            'store_password' => env('SSLCOMMERZ_STORE_PASSWORD', ''),
            'is_live' => env('SSLCOMMERZ_LIVE', false),
            'apiDomain' => env('SSLCOMMERZ_LIVE') ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com',
            'api' => [
                'make_payment' => '/gwprocess/v4/api.php',
                'validate' => '/validator/api/validationserverAPI.php',
            ],
            'success_url' => '/api/payments/ssl/success',
            'failed_url' => '/api/payments/ssl/fail',
            'cancel_url' => '/api/payments/ssl/cancel',
            'ipn_url' => '/api/payments/ssl/ipn',
        ];

        $this->config = array_merge($defaults, $this->config);
    }

    protected function baseUrl()
    {
        return $this->config['apiDomain'] ?? '';
    }

    public function startPayment(Invoice $invoice, Payment $payment)
    {
        // Ensure we have a transaction id to send to the gateway
        if (empty($payment->transaction_id)) {
            $payment->transaction_id = (string) Str::uuid();
            $payment->save();
        }

        // Try to derive customer fields from invoice then related order/payment
        $relatedOrder = $invoice->order ?? $payment->order ?? null;

        $cus_name = $invoice->customer_name ?? ($relatedOrder->customer_name ?? '');
        $cus_email = $invoice->customer_email ?? ($relatedOrder->customer_email ?? '');
        $cus_phone = $invoice->customer_phone ?? ($relatedOrder->customer_phone ?? '');
        $cus_add1 = $invoice->customer_address ?? ($relatedOrder->customer_address ?? '');

        // If email is still missing, fallback to demo values for sandbox/testing
        $usedDemo = false;
        if (empty($cus_email)) {
            $cus_email = 'demouser@gmail.com';
            $usedDemo = true;
        }

        if (empty($cus_phone)) {
            $cus_phone = '01700000000';
            $usedDemo = true;
        }

        // cus_city is required by gateway; fallback to demo city
        $cus_city = $invoice->customer_city ?? ($relatedOrder->customer_city ?? '');
        if (empty($cus_city)) {
            $cus_city = 'Dhaka';
            $usedDemo = true;
        }

        if ($usedDemo) {
            Log::info('PaymentService: using demo customer info for sandbox', ['invoice_id' => $invoice->id, 'transaction_id' => $payment->transaction_id]);
        }

        $post = [
            'store_id' => $this->config['store_id'] ?? '',
            'store_passwd' => $this->config['store_password'] ?? '',
            'total_amount' => (float)($invoice->grand_total ?? 0),
            'currency' => 'BDT',
            'tran_id' => $payment->transaction_id ?? '',
            'success_url' => url($this->config['success_url'] ?? ''),
            'fail_url' => url($this->config['failed_url'] ?? ''),
            'cancel_url' => url($this->config['cancel_url'] ?? ''),
            'ipn_url' => url($this->config['ipn_url'] ?? ''),
            'cus_name' => $cus_name,
            'cus_email' => $cus_email,
            'cus_add1' => $cus_add1,
            'cus_phone' => $cus_phone,
            'cus_city' => $cus_city,
            // common extra fields SSLCommerz may validate
            'cus_state' => $invoice->customer_state ?? ($relatedOrder->customer_state ?? 'Dhaka'),
            'cus_postcode' => $invoice->customer_postcode ?? ($relatedOrder->customer_postcode ?? '0000'),
            'cus_country' => $invoice->customer_country ?? ($relatedOrder->customer_country ?? 'Bangladesh'),
            'product_name' => 'Invoice #' . ($invoice->invoice_number ?? $invoice->id ?? ''),
            'product_category' => 'service',
            'product_profile' => 'general',
            'num_of_item' => 1,
            'product_amount' => (float)($invoice->grand_total ?? 0),
            'shipping_method' => 'NO',
        ];

        $makePaymentPath = $this->config['api']['make_payment'] ?? '';
        // build URL safely
        $base = rtrim($this->baseUrl(), '/');
        $path = ltrim($makePaymentPath, '/');
        $url = $base !== '' ? ($base . ($path !== '' ? '/' . $path : '')) : $path;

        if (empty($url)) {
            Log::error('PaymentService: payment URL not configured', ['config' => $this->config]);
            return response()->json(['message' => 'Payment gateway not configured'], 500);
        }

        // Check for presence of credentials before attempting the request
        if (empty($this->config['store_id']) || empty($this->config['store_password'])) {
            Log::warning('PaymentService: missing store credentials', ['store_id' => $this->config['store_id'] ?? null]);
            return response()->json(['message' => 'Payment credentials not configured'], 500);
        }

        // Log the payload we're about to send (without credentials)
        $logged = $post;
        unset($logged['store_passwd']);
        Log::debug('PaymentService: posting to gateway', ['url' => $url, 'payload' => $logged]);

        try {
            $response = Http::asForm()->post($url, $post);
        } catch (\Exception $e) {
            Log::error('PaymentService: http request failed', ['exception' => $e->getMessage(), 'url' => $url, 'post' => $logged]);
            return response()->json(['message' => 'Payment gateway unreachable', 'error' => $e->getMessage()], 502);
        }

        $data = null;
        try {
            $data = $response->json();
        } catch (\Exception $e) {
            Log::error('PaymentService: invalid json response', ['body' => $response->body(), 'status' => $response->status()]);
            $payment->raw_response = ['body' => $response->body(), 'status' => $response->status()];
            $payment->save();
            return response()->json(['message' => 'Invalid response from payment gateway', 'status' => $response->status()], 502);
        }

        // Persist raw response for debugging
        $payment->raw_response = $data;
        $payment->save();

        // If gateway returned a checkout URL, return it to the frontend
        if (!empty($data['GatewayPageURL'])) {
            return response()->json(['checkout_url' => $data['GatewayPageURL']]);
        }

        // If gateway returned an error payload, include that to help debugging
        Log::warning('PaymentService: failed to get GatewayPageURL', ['response' => $data, 'url' => $url]);
        return response()->json(['message' => 'Failed to initiate payment', 'gateway_response' => $data], 400);
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
        if ($invoice) {
            // create corresponding InvoicePayment so invoice.paid_amount accessor updates
            $existing = \Modules\Invoice\Models\InvoicePayment::where('payment_reference', $payment->transaction_id)->first();
            if (!$existing) {
                \Modules\Invoice\Models\InvoicePayment::create([
                    'invoice_id' => $invoice->id,
                    'payment_reference' => $payment->transaction_id,
                    'staff_id' => null,
                    'amount' => $payment->amount ?? $invoice->grand_total ?? 0,
                    'method' => $payment->gateway ?? 'sslcommerz',
                    'status' => 'completed',
                    'note' => 'Payment via gateway',
                ]);
            }

            $invoice->status = 'paid';
            $invoice->save();

            // update order payment_status if linked
            if ($invoice->order) {
                $order = $invoice->order;
                $order->payment_status = 'paid';
                $order->save();
            }
        }

        // Redirect the user back to the public track page so the frontend can re-load and show status
        $invoiceNumber = $invoice->invoice_number ?? $invoice->id ?? '';
        return redirect(config('app.frontend_url') . "/track?q=" . urlencode($invoiceNumber) . "&payment=success");
    }

    public function handleFail($request)
    {
        $tranId = $request->tran_id;
        Payment::where('transaction_id', $tranId)->update(['status' => 'failed']);
        $invoice = Payment::where('transaction_id', $tranId)->first()?->invoice;
        $q = $invoice?->invoice_number ?? '';
        return redirect(config('app.frontend_url') . "/track?q=" . urlencode($q) . "&payment=failed");
    }

    public function handleCancel($request)
    {
        $tranId = $request->tran_id;
        Payment::where('transaction_id', $tranId)->update(['status' => 'cancelled']);
        $invoice = Payment::where('transaction_id', $tranId)->first()?->invoice;
        $q = $invoice?->invoice_number ?? '';
        return redirect(config('app.frontend_url') . "/track?q=" . urlencode($q) . "&payment=cancelled");
    }

    public function handleIpn($request)
    {
        Log::info('SSLCommerz IPN received', $request->all());
        return response('IPN OK', 200);
    }
}
