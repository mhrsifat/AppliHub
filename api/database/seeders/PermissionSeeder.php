<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'viewAdmin',
            'addAdmin',
            'updateAdmin',
            'deleteAdmin',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);
        }

        // Ensure admin role exists and has all permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions($permissions);

        $employeeRole = Role::firstOrCreate(['name' => 'employee']);
        $staffRole = Role::firstOrCreate(['name' => 'staff']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);

        $this->command->info('✅ Employee permissions & admin role synced successfully.');
    }
}