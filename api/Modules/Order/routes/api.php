<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

// Public endpoint for anonymous order/invoice tracking
Route::get('/public/track-order', [OrderController::class, 'publicTrack']);

Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

Route::prefix('orders')->middleware(['multi-auth'])->group(function () {
    Route::get('/{id}/full-details', [OrderController::class, 'getFullOrderDetails']);
  
    Route::get('/', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::put('/{id}', [OrderController::class, 'update'])->name('orders.update');
    Route::delete('/{id}', [OrderController::class, 'destroy'])->name('orders.destroy');

    // Order items
    Route::post('/{orderId}/items', [OrderController::class, 'addItem'])->name('orders.items.add');
    Route::put('/{orderId}/items/{itemId}', [OrderController::class, 'updateItem'])->name('orders.items.update');
    Route::delete('/{orderId}/items/{itemId}', [OrderController::class, 'deleteItem'])->name('orders.items.delete');
    
    Route::post('/{id}/assign', [OrderController::class, 'assign'])->name('orders.assign');
    Route::post('/{id}/unassign', [OrderController::class, 'unassign'])->name('orders.unassign');
    
    Route::post('/{id}/status', [OrderController::class, 'changeStatus'])->name('orders.change.status');
    
    Route::post('/{order}/invoices', [\Modules\Invoice\Http\Controllers\InvoiceController::class, 'createFromOrder']);
});