<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Modules\Order\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;

class OrderUnassignTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $employee;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        \Spatie\Permission\Models\Role::create(['name' => 'admin']);
        \Spatie\Permission\Models\Role::create(['name' => 'employee']);

        $this->admin = User::factory()->create()->assignRole('admin');
        $this->employee = User::factory()->create()->assignRole('employee');

        // Initially assigned order
        $this->order = Order::factory()->create([
            'assigned_to' => $this->employee->id,
        ]);
    }

    #[Test]
    public function admin_can_unassign_an_order()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/orders/{$this->order->id}/unassign");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Order unassigned',
                'order' => ['assigned_to' => null],
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'assigned_to' => null,
        ]);
    }

    #[Test]
    public function non_admin_cannot_unassign_order()
    {
        Sanctum::actingAs($this->employee);

        $response = $this->postJson("/api/orders/{$this->order->id}/unassign");

        $response->assertStatus(403);
        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'assigned_to' => $this->employee->id,
        ]);
    }

    #[Test]
    public function admin_cannot_unassign_nonexistent_order()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/orders/99999/unassign");

        $response->assertStatus(404);
    }

    #[Test]
    public function unassigned_order_stays_unassigned()
    {
        $unassignedOrder = Order::factory()->create(['assigned_to' => null]);
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/orders/{$unassignedOrder->id}/unassign");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Order unassigned']);

        $this->assertDatabaseHas('orders', [
            'id' => $unassignedOrder->id,
            'assigned_to' => null,
        ]);
    }
}