<?php

namespace Modules\Employee\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Employee\Models\Employee;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Str;

class EmployeeDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure default roles exist
        $roles = ['admin', 'employee'];
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);
        }
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'sanctum']);
        }

        // Create sample employees
        $employees = [
            [
                'first_name' => 'Rafi',
                'last_name'  => 'Ahmed',
                'email'      => 'rafi@example.com',
                'phone'      => '01710000001',
                'password'   => Hash::make('password'),
                'status'     => 'active',
                'roles'      => ['admin'],
            ],
            [
                'first_name' => 'Kalo Employee',
                'last_name'  => 'Ahmed',
                'email'      => 'employee@gmail.com',
                'phone'      => '01710000004',
                'password'   => Hash::make(12345678),
                'status'     => 'active',
                'roles'      => ['employee'],
            ],
            [
                'first_name' => 'Sadia',
                'last_name'  => 'Hossain',
                'email'      => 'sadia@example.com',
                'phone'      => '01710000002',
                'password'   => Hash::make('password'),
                'status'     => 'active',
                'roles'      => ['employee'],
            ],
            [
                'first_name' => 'Tarek',
                'last_name'  => 'Khan',
                'email'      => 'tarek@example.com',
                'phone'      => '01710000003',
                'password'   => Hash::make('password'),
                'status'     => 'inactive',
                'roles'      => ['employee'],
            ],
        ];

        foreach ($employees as $data) {
            $employee = Employee::updateOrCreate(
                ['email' => $data['email']],
                [
                    'first_name' => $data['first_name'],
                    'last_name'  => $data['last_name'],
                    'email'      => $data['email'],
                    'phone'      => $data['phone'],
                    'password'   => $data['password'],
                    'status'     => $data['status'],
                    'avatar'     => null,
                ]
            );

            $employee->syncRoles($data['roles']);
        }

        // Add 50 random employees
        //$fakerEmployees = Employee::factory(50)->create();

        // Assign random roles
        // $fakerEmployees->each(function ($employee) use ($roles) {
        //$employee->syncRoles(collect($roles)->random());
        //  });

        $this->command->info('✅ Employee + Role seeding complete (including 50 fake employees).');
    }
}
