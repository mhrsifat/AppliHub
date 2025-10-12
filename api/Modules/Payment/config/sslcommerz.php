<?php

$apiDomain = env('SSLCOMMERZ_LIVE') 
    ? "https://securepay.sslcommerz.com" 
    : "https://sandbox.sslcommerz.com";

return [
    'store_id' => env('SSLCOMMERZ_STORE_ID'),
    'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),
    'is_live' => env('SSLCOMMERZ_LIVE', false),
    'apiDomain' => $apiDomain,
    'api' => [
        'make_payment' => "/gwprocess/v4/api.php",
        'validate' => "/validator/api/validationserverAPI.php",
    ],
    'success_url' => '/api/payments/ssl/success',
    'failed_url' => '/api/payments/ssl/fail',
    'cancel_url' => '/api/payments/ssl/cancel',
    'ipn_url' => '/api/payments/ssl/ipn',
];