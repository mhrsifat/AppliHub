<?php
// Filepath: Modules/Employee/Http/Controllers/EmployeeController.php

namespace Modules\Employee\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Http\Controllers\Controller;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeSalary;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    /**
     * List employees with filters.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Employee::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%");
            });
        }

        $employees = $query->latest()->paginate($request->get('per_page', 12));
        return response()->json($employees);
    }

    /**
     * Store new employee.
     * Admin can create any role.
     * Manager can create only staff/employee.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'nullable|string|max:100',
            'email'        => 'required|email|unique:employees,email',
            'phone'        => 'nullable|string|max:30|unique:employees,phone',
            'password'     => 'required|min:6',
            'location'     => 'nullable|string|max:255',
            'full_address' => 'nullable|string',
            'avatar'       => 'nullable|image|max:2048',
            'status'       => ['nullable', Rule::in(['active', 'inactive'])],
            'role'         => ['nullable', 'string'], // admin/manager/staff/employee
        ]);

        // default role aligns with existing UserSeeder: 'employee'
        $role = $validated['role'] ?? 'employee';

        // Manager cannot create manager/admin
        if ($user->hasRole('manager') && in_array($role, ['manager', 'admin'])) {
            return response()->json(['message' => 'Manager cannot create manager or admin'], 403);
        }

        // Acceptable roles
        $validRoles = ['admin', 'manager', 'staff', 'employee'];
        if (! in_array($role, $validRoles)) {
            return response()->json(['message' => 'Invalid role provided'], 422);
        }

        // Ensure role exists (if seeder didn't create it)
        Role::firstOrCreate(['name' => $role]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $validated['password'] = Hash::make($validated['password']);
        $validated['created_by'] = auth()->id();

        $employee = Employee::create($validated);

        // Assign role using Spatie HasRoles on Employee model
        $employee->assignRole($role);

        return response()->json([
            'message'  => 'Employee created successfully',
            'employee' => $employee->fresh()
        ], 201);
    }

    /**
     * Show single employee.
     */
    public function show($id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::withTrashed()->findOrFail($id);
        return response()->json($employee);
    }

    /**
     * Update employee.
     * Manager cannot escalate roles.
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'first_name'   => 'sometimes|required|string|max:100',
            'last_name'    => 'nullable|string|max:100',
            'email'        => ['sometimes','required','email', Rule::unique('employees')->ignore($employee->id)],
            'phone'        => ['nullable', 'string', 'max:30', Rule::unique('employees')->ignore($employee->id)],
            'location'     => 'nullable|string|max:255',
            'full_address' => 'nullable|string',
            'status'       => ['nullable', Rule::in(['active', 'inactive'])],
            'avatar'       => 'nullable|image|max:2048',
            'password'     => 'nullable|min:6',
            'role'         => ['nullable', 'string'],
        ]);

        if (isset($validated['role'])) {
            $role = $validated['role'];

            // Accept employee role as well
            $validRoles = ['admin', 'manager', 'staff', 'employee'];
            if (! in_array($role, $validRoles)) {
                return response()->json(['message' => 'Invalid role provided'], 422);
            }

            // Manager cannot upgrade to manager/admin
            if ($user->hasRole('manager') && in_array($role, ['manager', 'admin'])) {
                return response()->json(['message' => 'Manager cannot assign manager or admin role'], 403);
            }

            // Ensure role exists
            Role::firstOrCreate(['name' => $role]);
        }

        if ($request->hasFile('avatar')) {
            if ($employee->avatar) {
                Storage::disk('public')->delete($employee->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['updated_by'] = auth()->id();
        $employee->update($validated);

        if (isset($role)) {
            $employee->syncRoles([$role]);
        }

        return response()->json([
            'message'  => 'Employee updated successfully',
            'employee' => $employee->fresh()
        ]);
    }

    /**
     * Soft delete employee.
     */
    public function destroy($id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::findOrFail($id);
        $employee->delete();

        return response()->json(['message' => 'Employee deleted (soft)']);
    }

    /**
     * Restore soft-deleted employee.
     */
    public function restore($id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->restore();

        return response()->json(['message' => 'Employee restored']);
    }

    /**
     * Add salary / promotion record for employee.
     * Only admin can manage promotion (promotion = true)
     */
    public function addSalary(Request $request, $id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'base_salary'     => 'required|numeric|min:0',
            'bonus'           => 'nullable|numeric|min:0',
            'promotion_title' => 'nullable|string|max:255',
            'effective_from'  => 'nullable|date',
            'paid_month'      => 'nullable|string|max:50', // e.g. "October 2025"
            'remarks'         => 'nullable|string',
            'is_promotion'    => 'nullable|boolean',
        ]);

        // if it's a promotion action, only admin can do it
        if (! empty($validated['is_promotion']) && $validated['is_promotion']) {
            if (! $user->hasRole('admin')) {
                return response()->json(['message' => 'Only admin can perform promotion'], 403);
            }
        }

        $salary = EmployeeSalary::create(array_merge($validated, [
            'employee_id' => $employee->id,
            'created_by'  => $user->id,
        ]));

        return response()->json([
            'message' => 'Salary record added',
            'salary'  => $salary
        ], 201);
    }

    /**
     * List salary history for an employee.
     */
    public function salaries(Request $request, $id)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $employee = Employee::findOrFail($id);

        $query = EmployeeSalary::where('employee_id', $employee->id);

        if ($request->filled('paid_month')) {
            $query->where('paid_month', $request->paid_month);
        }

        $salaries = $query->orderBy('effective_from', 'desc')->get();

        return response()->json($salaries);
    }

    /**
     * Delete a salary record.
     */
    public function deleteSalary($id, $salaryId)
    {
        $user = auth()->user();

        if (! $user->hasAnyRole(['admin', 'manager'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $salary = EmployeeSalary::where('employee_id', $id)->findOrFail($salaryId);
        $salary->delete();

        return response()->json(['message' => 'Salary record deleted']);
    }
}