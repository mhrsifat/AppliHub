<?php
// Filepath: Modules/Employee/Models/EmployeeSalary.php

namespace Modules\Employee\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeSalary extends Model
{
    use SoftDeletes;

    protected $table = 'employee_salaries';

    protected $fillable = [
        'employee_id',
        'base_salary',
        'bonus',
        'promotion_title',
        'effective_from',
        'paid_month',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'base_salary' => 'decimal:2',
        'bonus' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}