<?php

use Illuminate\Support\Facades\Route;
use Modules\Service\Http\Controllers\ServiceController;

Route::prefix('admin')->group(function () {
    Route::apiResource('services', ServiceController::class);
    Route::get('services/{service}/price-history', [ServiceController::class,'priceHistory']);
    Route::post('services/import', [ServiceController::class,'import']);
    Route::get('services/export', [ServiceController::class,'export']);
    Route::post('services/{id}/restore', [ServiceController::class,'restore']);
});
