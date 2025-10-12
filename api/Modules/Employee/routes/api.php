<?php

use Illuminate\Support\Facades\Route;
use Modules\Employee\Http\Controllers\EmployeeController;

Route::prefix('employees')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/', [EmployeeController::class, 'index']);
    Route::post('/', [EmployeeController::class, 'store']);
    Route::get('/{id}', [EmployeeController::class, 'show']);
    Route::put('/{id}', [EmployeeController::class, 'update']);
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);
    Route::post('/restore/{id}', [EmployeeController::class, 'restore']);

    // salary & promotion
    Route::post('/{id}/salary', [EmployeeController::class, 'addSalary']);
    Route::get('/{id}/salaries', [EmployeeController::class, 'salaries']);
    Route::delete('/{id}/salaries/{salaryId}', [EmployeeController::class, 'deleteSalary']);
});