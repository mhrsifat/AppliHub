<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // -----------------------------
        // 1️⃣ Roles
        // -----------------------------
        $userRole     = Role::firstOrCreate(['name' => 'user']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);
        $adminRole    = Role::firstOrCreate(['name' => 'admin']);

        // -----------------------------
        // 2️⃣ Permissions
        // -----------------------------
        $permissions = [
            'view dashboard',
            'manage users',
            'manage employees',
            'manage projects',
            'view reports',
            'edit settings',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Admin role gets all permissions
        $adminRole->givePermissionTo(Permission::all());

        // -----------------------------
        // 3️⃣ Users
        // -----------------------------
        $usersData = [
            ['name' => 'Admin User', 'email' => 'admin@gmail.com', 'role' => $adminRole],
            ['name' => 'Employee User', 'email' => 'employee@gmail.com', 'role' => $employeeRole],
            ['name' => 'Normal User', 'email' => 'user@gmail.com', 'role' => $userRole],
            ['name' => 'MhrSifat', 'email' => 'mhrsifat@gmail.com', 'role' => $userRole],
        ];

        foreach ($usersData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'email_verified_at' => now(),
                    'password' => bcrypt('12345678'),
                    'remember_token' => Str::random(10),
                ]
            );

            // Assign role
            $user->assignRole($data['role']);

            // Give all permissions if admin
            if ($data['role']->name === 'admin') {
                $user->givePermissionTo(Permission::all());
            }
        }

        // -----------------------------
        // 4️⃣ Optional: Add factory users
        // -----------------------------
        // Example: create 5 random users with 'user' role
        \App\Models\User::factory(5)->create()->each(function ($u) use ($userRole) {
            $u->assignRole($userRole);
        });
    }
}