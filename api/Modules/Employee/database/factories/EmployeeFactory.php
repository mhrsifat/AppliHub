<?php

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Employee\Models\Employee;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        $first = $this->faker->firstName();
        $last  = $this->faker->lastName();

        return [
            'first_name' => $first,
            'last_name'  => $last,
            'email'      => strtolower($first . '.' . $last . '@example.com'),
            'phone'      => '01' . $this->faker->numerify('#########'),
            'password'   => Hash::make('password'),
            'status'     => $this->faker->randomElement(['active', 'inactive']),
            'avatar'     => null, // You can later link storage/avatar.png if needed
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Quick state for active employees.
     */
    public function active(): self
    {
        return $this->state(fn () => ['status' => 'active']);
    }

    /**
     * Quick state for inactive employees.
     */
    public function inactive(): self
    {
        return $this->state(fn () => ['status' => 'inactive']);
    }
}