<?php

use Illuminate\Support\Facades\Route;
use Modules\Employee\Http\Controllers\EmployeeController;

Route::group(['prefix' => 'employees', 'middleware' => ['api','auth:sanctum']], function () {
    Route::get('/', [EmployeeController::class, 'index']);
    Route::post('/', [EmployeeController::class, 'store']);
    Route::get('/{id}', [EmployeeController::class, 'show']);
    Route::put('/{id}', [EmployeeController::class, 'update']);
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);

    // extra endpoints for soft-delete/restore/force-delete
    Route::post('/{id}/restore', [EmployeeController::class, 'restore']);
    Route::delete('/{id}/force', [EmployeeController::class, 'forceDestroy']);
});