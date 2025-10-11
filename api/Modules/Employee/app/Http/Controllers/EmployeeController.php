<?php

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Modules\Employee\Models\Employee;
use Modules\Employee\Http\Requests\StoreEmployeeRequest;
use Modules\Employee\Http\Requests\UpdateEmployeeRequest;
use Modules\Employee\Transformers\EmployeeResource;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource with search, filters, sorting and pagination.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);

        $query = Employee::query()->with('roles');

        // full-text-ish search across name/email/phone
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        // filter by status (active/inactive)
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // filter by role name
        if ($request->filled('role')) {
            $role = $request->input('role');
            $query->whereHas('roles', fn($q) => $q->where('name', $role));
        }

        // sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $employees = $query->paginate($perPage)->appends($request->query());

        return EmployeeResource::collection($employees);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeeRequest $request)
    {
        $data = $request->validated();

        // normalize empty strings to null for nullable DB columns
        $data['location'] = array_key_exists('location', $data) && $data['location'] !== '' ? $data['location'] : null;
        $data['full_address'] = array_key_exists('full_address', $data) && $data['full_address'] !== '' ? $data['full_address'] : null;

        DB::beginTransaction();
        try {
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $employee = Employee::create($data);

            // avatar upload
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store("employees/avatars", 'public');
                $employee->avatar = $path;
                $employee->save();
            }

            // sync roles (expects roles as array of role names or ids)
            if (!empty($data['roles'])) {
                $employee->syncRoles($data['roles']);
            }

            DB::commit();

            return new EmployeeResource($employee->fresh('roles'));
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Failed to create employee',
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        $employee = Employee::with('roles')->findOrFail($id);
        return new EmployeeResource($employee);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeeRequest $request, $id)
    {
        $data = $request->validated();
        $employee = Employee::findOrFail($id);

        DB::beginTransaction();
        try {
            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']); // don't overwrite with null
            }

            // normalize empty strings to null for nullable DB columns
            if (array_key_exists('location', $data)) {
                $data['location'] = $data['location'] !== '' ? $data['location'] : null;
            }
            if (array_key_exists('full_address', $data)) {
                $data['full_address'] = $data['full_address'] !== '' ? $data['full_address'] : null;
            }

            // handle avatar replacement
            if ($request->hasFile('avatar')) {
                // delete old avatar if exists
                if ($employee->avatar) {
                    Storage::disk('public')->delete($employee->avatar);
                }
                $data['avatar'] = $request->file('avatar')->store("employees/avatars", 'public');
            }

            $employee->update($data);

            if (array_key_exists('roles', $data)) {
                $employee->syncRoles($data['roles'] ?? []);
            }

            DB::commit();

            return new EmployeeResource($employee->fresh('roles'));
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'Failed to update employee',
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Soft-delete the specified resource.
     */
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();

        return response()->json(['message' => 'Employee deleted'], Response::HTTP_OK);
    }

    /**
     * Restore a soft-deleted employee.
     */
    public function restore($id)
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        if (!$employee->trashed()) {
            return response()->json(['message' => 'Employee is not deleted'], Response::HTTP_BAD_REQUEST);
        }
        $employee->restore();

        return new EmployeeResource($employee->fresh('roles'));
    }

    /**
     * Permanently delete the specified resource.
     */
    public function forceDestroy($id)
    {
        $employee = Employee::withTrashed()->findOrFail($id);

        // cleanup avatar file if exists
        if ($employee->avatar) {
            Storage::disk('public')->delete($employee->avatar);
        }

        $employee->forceDelete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
