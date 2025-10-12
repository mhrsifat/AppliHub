<?php

use Illuminate\Support\Facades\Route;
use Modules\Payment\Http\Controllers\PaymentController;


Route::post('/payments/initiate', [PaymentController::class, 'initiate']);

// Public callbacks
Route::post('/payments/ssl/success', [PaymentController::class, 'sslSuccess'])->name('payments.ssl.success');
Route::post('/payments/ssl/fail',    [PaymentController::class, 'sslFail'])->name('payments.ssl.fail');
Route::post('/payments/ssl/cancel',  [PaymentController::class, 'sslCancel'])->name('payments.ssl.cancel');
Route::post('/payments/ssl/ipn',     [PaymentController::class, 'sslIpn'])->name('payments.ssl.ipn');