<?php

namespace Modules\Payment\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Models\Payment;
use Modules\Invoice\Models\InvoicePayment;

class PaymentService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('sslcommerz') ?? [];

        $defaults = [
            'store_id' => env('SSLCOMMERZ_STORE_ID', ''),
            'store_password' => env('SSLCOMMERZ_STORE_PASSWORD', ''),
            'is_live' => env('SSLCOMMERZ_LIVE', false),
            'apiDomain' => env('SSLCOMMERZ_LIVE')
                ? 'https://securepay.sslcommerz.com'
                : 'https://sandbox.sslcommerz.com',
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

    /**
     * 🔹 Resolve frontend URL dynamically
     */
    protected function resolveFrontendUrl($request = null): string
    {
        $frontend = null;

        // 1️⃣ Try frontend_url from request
        if ($request && $request->has('frontend_url')) {
            $frontend = rtrim($request->input('frontend_url'), '/');
        }

        // 2️⃣ If not given, use fallback .env FRONTEND_URL
        if (!$frontend) {
            $frontend = rtrim(config('app.frontend_url'), '/');
        }

        // 3️⃣ (optional) whitelist enforcement
        $allowed = config('app.allowed_frontends', []);
        if (!empty($allowed) && !in_array($frontend, $allowed)) {
            Log::warning('Unrecognized frontend URL, using fallback.', [
                'requested' => $frontend,
                'allowed' => $allowed,
            ]);
            $frontend = rtrim(config('app.frontend_url'), '/');
        }

        return $frontend;
    }

    /**
     * 🔹 Start payment process
     */
    public function startPayment(Invoice $invoice, Payment $payment, $request = null)
    {
        // store frontend origin if sent from frontend
        $frontendUrl = $this->resolveFrontendUrl($request);

        if (empty($payment->transaction_id)) {
            $payment->transaction_id = (string) Str::uuid();
            $payment->save();
        }

        $relatedOrder = $invoice->order ?? $payment->order ?? null;

        $cus_name = $invoice->customer_name ?? ($relatedOrder->customer_name ?? '');
        $cus_email = $invoice->customer_email ?? ($relatedOrder->customer_email ?? '');
        $cus_phone = $invoice->customer_phone ?? ($relatedOrder->customer_phone ?? '');
        $cus_add1 = $invoice->customer_address ?? ($relatedOrder->customer_address ?? '');

        $usedDemo = false;
        if (empty($cus_email)) {
            $cus_email = 'demouser@gmail.com';
            $usedDemo = true;
        }
        if (empty($cus_phone)) {
            $cus_phone = '01700000000';
            $usedDemo = true;
        }

        $cus_city = $invoice->customer_city ?? ($relatedOrder->customer_city ?? 'Dhaka');

        if ($usedDemo) {
            Log::info('PaymentService: using demo customer info for sandbox', [
                'invoice_id' => $invoice->id,
                'transaction_id' => $payment->transaction_id,
            ]);
        }

        $post = [
            'store_id' => $this->config['store_id'] ?? '',
            'store_passwd' => $this->config['store_password'] ?? '',
            'total_amount' => (float)($invoice->grand_total ?? 0),
            'currency' => 'BDT',
            'tran_id' => $payment->transaction_id ?? '',
            'success_url' => url($this->config['success_url']),
            'fail_url' => url($this->config['failed_url']),
            'cancel_url' => url($this->config['cancel_url']),
            'ipn_url' => url($this->config['ipn_url']),
            'cus_name' => $cus_name,
            'cus_email' => $cus_email,
            'cus_add1' => $cus_add1,
            'cus_phone' => $cus_phone,
            'cus_city' => $cus_city,
            'cus_state' => $invoice->customer_state ?? ($relatedOrder->customer_state ?? 'Dhaka'),
            'cus_postcode' => $invoice->customer_postcode ?? ($relatedOrder->customer_postcode ?? '0000'),
            'cus_country' => $invoice->customer_country ?? ($relatedOrder->customer_country ?? 'Bangladesh'),
            'product_name' => 'Invoice #' . ($invoice->invoice_number ?? $invoice->id ?? ''),
            'product_category' => 'service',
            'product_profile' => 'general',
            'num_of_item' => 1,
            'product_amount' => (float)($invoice->grand_total ?? 0),
            'shipping_method' => 'NO',
            // pass frontend_url to callback handlers
            'value_a' => $frontendUrl,
        ];

        $url = rtrim($this->baseUrl(), '/') . '/' . ltrim($this->config['api']['make_payment'], '/');

        if (empty($this->config['store_id']) || empty($this->config['store_password'])) {
            Log::warning('PaymentService: missing store credentials');
            return response()->json(['message' => 'Payment credentials not configured'], 500);
        }

        Log::debug('PaymentService: posting to gateway', ['url' => $url, 'payload' => $post]);

        try {
            $response = Http::asForm()->post($url, $post);
        } catch (\Exception $e) {
            Log::error('PaymentService: http request failed', ['exception' => $e->getMessage()]);
            return response()->json(['message' => 'Payment gateway unreachable'], 502);
        }

        $data = $response->json();

        $payment->raw_response = $data;
        $payment->save();

        if (!empty($data['GatewayPageURL'])) {
            return response()->json(['checkout_url' => $data['GatewayPageURL']]);
        }

        Log::warning('PaymentService: failed to get GatewayPageURL', ['response' => $data]);
        return response()->json([
            'message' => 'Failed to initiate payment',
            'gateway_response' => $data,
        ], 400);
    }

    /**
     * 🔹 Handle success callback
     */
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
            $existing = InvoicePayment::where('payment_reference', $payment->transaction_id)->first();
            if (!$existing) {
                InvoicePayment::create([
                    'invoice_id' => $invoice->id,
                    'payment_reference' => $payment->transaction_id,
                    'amount' => $payment->amount ?? $invoice->grand_total ?? 0,
                    'method' => $payment->gateway ?? 'sslcommerz',
                    'status' => 'completed',
                    'note' => 'Payment via gateway',
                ]);
            }

            $invoice->status = 'paid';
            $invoice->save();

            if ($invoice->order) {
                $invoice->order->update(['payment_status' => 'paid']);
            }
        }

        $frontend = $request->value_a ?? $this->resolveFrontendUrl($request);
        $invoiceNumber = $invoice->invoice_number ?? $invoice->id ?? '';

        return redirect("{$frontend}/track?q=" . urlencode($invoiceNumber) . "&payment=success&popup=1");
    }

    /**
     * 🔹 Handle failed payment
     */
    public function handleFail($request)
    {
        $tranId = $request->tran_id;
        $frontend = $request->value_a ?? $this->resolveFrontendUrl($request);

        Payment::where('transaction_id', $tranId)->update(['status' => 'failed']);
        $invoice = Payment::where('transaction_id', $tranId)->first()?->invoice;
        $q = $invoice?->invoice_number ?? '';

        return redirect("{$frontend}/track?q=" . urlencode($q) . "&payment=failed&popup=1");
    }

    /**
     * 🔹 Handle cancelled payment
     */
    public function handleCancel($request)
    {
        $tranId = $request->tran_id;
        $frontend = $request->value_a ?? $this->resolveFrontendUrl($request);

        Payment::where('transaction_id', $tranId)->update(['status' => 'cancelled']);
        $invoice = Payment::where('transaction_id', $tranId)->first()?->invoice;
        $q = $invoice?->invoice_number ?? '';

        return redirect("{$frontend}/track?q=" . urlencode($q) . "&payment=cancelled&popup=1");
    }

    /**
     * 🔹 IPN callback (optional)
     */
    public function handleIpn($request)
    {
        Log::info('SSLCommerz IPN received', $request->all());
        return response('IPN OK', 200);
    }
}