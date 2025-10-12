<?php
// Filepath: tests/Feature/EmployeeManagementTest.php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\EmployeeSalary;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;

class EmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // create roles
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'staff']);
    }

    public function test_admin_can_create_manager_and_employee_and_promote()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin, ['*'], 'sanctum');

        // create manager via API
        $resp = $this->postJson('/api/employees', [
            'first_name' => 'ManagerFirst',
            'email' => 'manager@example.com',
            'password' => 'password',
            'role' => 'manager'
        ]);
        $resp->assertStatus(201);
        $managerId = $resp->json('employee.id');

        // create staff
        $resp2 = $this->postJson('/api/employees', [
            'first_name' => 'StaffFirst',
            'email' => 'staff@example.com',
            'password' => 'password',
            'role' => 'staff'
        ]);
        $resp2->assertStatus(201);
        $staffId = $resp2->json('employee.id');

        // admin promotes staff (is_promotion = true)
        $promoteResp = $this->postJson("/api/employees/{$staffId}/salary", [
            'base_salary' => 70000,
            'bonus' => 5000,
            'promotion_title' => 'Senior Dev',
            'effective_from' => now()->toDateString(),
            'paid_month' => now()->format('F Y'),
            'is_promotion' => true,
        ]);
        $promoteResp->assertStatus(201);
        $this->assertDatabaseHas('employee_salaries', [
            'employee_id' => $staffId,
            'promotion_title' => 'Senior Dev',
        ]);
    }

    public function test_manager_cannot_create_manager_but_can_create_staff()
    {
        $managerUser = User::factory()->create();
        $managerUser->assignRole('manager');

        Sanctum::actingAs($managerUser, ['*'], 'sanctum');

        // try to create manager (should fail)
        $resp = $this->postJson('/api/employees', [
            'first_name' => 'AttemptManager',
            'email' => 'attemptmgr@example.com',
            'password' => 'password',
            'role' => 'manager'
        ]);
        $resp->assertStatus(403);

        // create staff (should pass)
        $resp2 = $this->postJson('/api/employees', [
            'first_name' => 'StaffByManager',
            'email' => 'staffmgr@example.com',
            'password' => 'password',
            'role' => 'staff'
        ]);
        $resp2->assertStatus(201);
    }

    public function test_non_admin_cannot_promote()
    {
        $managerUser = User::factory()->create();
        $managerUser->assignRole('manager');

        Sanctum::actingAs($managerUser, ['*'], 'sanctum');

        // create staff
        $resp = $this->postJson('/api/employees', [
            'first_name' => 'StaffX',
            'email' => 'staffx@example.com',
            'password' => 'password',
            'role' => 'staff'
        ]);
        $resp->assertStatus(201);
        $staffId = $resp->json('employee.id');

        // manager tries to promote staff (should fail)
        $promoteResp = $this->postJson("/api/employees/{$staffId}/salary", [
            'base_salary' => 80000,
            'is_promotion' => true,
            'promotion_title' => 'Lead',
            'effective_from' => now()->toDateString(),
        ]);
        $promoteResp->assertStatus(403);
    }
}