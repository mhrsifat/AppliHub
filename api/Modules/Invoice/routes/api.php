<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoice\Http\Controllers\InvoiceController;

Route::prefix('invoices')->group(function () {
    Route::get('/', [InvoiceController::class, 'index']);
    Route::post('/', [InvoiceController::class, 'store']);
    Route::get('{invoice}', [InvoiceController::class, 'show']);
    Route::put('{invoice}', [InvoiceController::class, 'update']);

    // items
    Route::post('{invoice}/items', [InvoiceController::class, 'addItem']);
    Route::put('{invoice}/items/{item}', [InvoiceController::class, 'updateItem']);
    Route::delete('{invoice}/items/{item}', [InvoiceController::class, 'removeItem']);

    // payments & refunds
    Route::post('{invoice}/payments', [InvoiceController::class, 'recordPayment']);
    Route::post('{invoice}/refunds', [InvoiceController::class, 'refund']);

    // helper to create invoice from order
    Route::post('from-order/{orderId}', [InvoiceController::class, 'createFromOrder']);
});
