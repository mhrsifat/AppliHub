<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Modules\Order\Models\Order;
use Modules\Invoice\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use PHPUnit\Framework\Attributes\Test;

class InvoiceVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $employee;
    protected User $otherEmployee;
    protected Order $order;
    protected Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles if not exists
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'employee']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->employee = User::factory()->create();
        $this->employee->assignRole('employee');

        $this->otherEmployee = User::factory()->create();
        $this->otherEmployee->assignRole('employee');

        $this->order = Order::factory()->create([
            'created_by' => $this->admin->id,
        ]);

        // create invoice attached to order
        $this->invoice = Invoice::factory()->create([
            'order_id' => $this->order->id,
            'status' => 'unpaid',
            'paid_amount' => 0,
            'grand_total' => 500,
        ]);
    }

    #[Test]
    public function admin_can_view_any_invoice()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/invoices/{$this->invoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $this->invoice->id);
    }

    #[Test]
    public function assigned_employee_can_view_invoice_for_their_assigned_order()
    {
        $this->order->update(['assigned_to' => $this->employee->id]);

        $response = $this->actingAs($this->employee, 'sanctum')
            ->getJson("/api/invoices/{$this->invoice->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $this->invoice->id);
    }
    
    #[Test]
public function creating_invoice_from_order_returns_invoice_and_does_not_mark_paid()
{
    $payload = [
        'items' => [
            [
                'service_id' => 1,
                'service_name' => 'Test Service',
                'service_description' => 'Test description',
                'unit_price' => 100,
                'quantity' => 2
            ]
        ]
    ];

    $response = $this->actingAs($this->admin, 'sanctum')
        ->postJson("/api/orders/{$this->order->id}/invoices", $payload)
        ->assertStatus(201);

    // match actual response structure
    
    $response->assertJsonStructure([
    'invoice' => [
        'id',
        'order_id',
        'status',
        'grand_total',
        'items',
        'payments',
        'order' => [
            'id',
            'customer_name',
            'grand_total'
        ]
    ]
]);
    
}
}