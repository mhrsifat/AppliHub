<?php

use Illuminate\Support\Facades\Route;
use Modules\Order\Http\Controllers\OrderController;

Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('{id}', [OrderController::class, 'show']);
    Route::put('{id}', [OrderController::class, 'update']);
    Route::delete('{id}', [OrderController::class, 'destroy']);

    // items
    Route::post('{id}/items', [OrderController::class, 'addItem']);
    Route::put('{id}/items/{itemId}', [OrderController::class, 'updateItem']);
    Route::delete('{id}/items/{itemId}', [OrderController::class, 'deleteItem']);
});