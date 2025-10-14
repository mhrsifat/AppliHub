<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoice\Http\Controllers\InvoiceController;


Route::get('/invoices/{invoice}/pdf', [\Modules\Invoice\Http\Controllers\InvoiceController::class, 'downloadPdf']);

Route::prefix('invoices')->middleware(['multi-auth'])->group(function () {
    Route::get('/', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');

    // Invoice Items
    Route::post('/{invoice}/items', [InvoiceController::class, 'addItem'])->name('invoices.items.add');
    Route::put('/{invoice}/items/{item}', [InvoiceController::class, 'updateItem'])->name('invoices.items.update');
    Route::delete('/{invoice}/items/{item}', [InvoiceController::class, 'deleteItem'])->name('invoices.items.delete');

    // Payments & Refunds
    Route::post('/{invoice}/payments', [InvoiceController::class, 'recordPayment'])->name('invoices.payments.record');
    Route::post('/{invoice}/refunds', [InvoiceController::class, 'refund'])->name('invoices.refund');
    
    
    
Route::get('stats/order/{orderId}', [\Modules\Invoice\Http\Controllers\StatsController::class, 'orderStats']);
Route::get('stats/invoice/{invoiceId}', [\Modules\Invoice\Http\Controllers\StatsController::class, 'invoiceDetails']);
Route::get('stats/dashboard', [\Modules\Invoice\Http\Controllers\StatsController::class, 'dashboardStats']);
Route::get('reports/invoices', [\Modules\Invoice\Http\Controllers\StatsController::class, 'reportInvoices']);
    
    // Route::post('/{order}/invoices', [InvoiceController::class, 'createFromOrder']);
});




Route::middleware(['multi-auth'])->group(function () {
    Route::get('stats/order/{orderId}', [\Modules\Invoice\Http\Controllers\StatsController::class, 'orderStats']);
    Route::get('stats/invoice/{invoiceId}', [\Modules\Invoice\Http\Controllers\StatsController::class, 'invoiceDetails']);
    Route::get('stats/dashboard', [\Modules\Invoice\Http\Controllers\StatsController::class, 'dashboardStats']);
    Route::get('reports/invoices', [\Modules\Invoice\Http\Controllers\StatsController::class, 'reportInvoices']);
});