<?php

use Illuminate\Support\Facades\Route;
use Modules\Invoice\Http\Controllers\InvoiceController;


Route::get('/invoices/{invoice}/pdf', [\Modules\Invoice\Http\Controllers\InvoiceController::class, 'downloadPdf']);

Route::prefix('invoices')->middleware(['auth:sanctum'])->group(function () {
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
    
    // Route::post('/{order}/invoices', [InvoiceController::class, 'createFromOrder']);
});