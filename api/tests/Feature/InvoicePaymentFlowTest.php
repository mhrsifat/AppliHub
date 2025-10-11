<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Modules\Order\Models\Order;
use Modules\Invoice\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\PermissionRegistrar;
use PHPUnit\Framework\Attributes\Test;

class InvoicePaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $employee;
    protected Order $order;
    protected Invoice $invoice;

    // In InvoicePaymentFlowTest - Fix the setUp method
    // In InvoicePaymentFlowTest setUp method
protected function setUp(): void
{
    parent::setUp();

    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->admin = User::factory()->withRole('admin')->create();
    $this->employee = User::factory()->withRole('employee')->create();

    $this->order = Order::factory()->create([
        'created_by' => $this->admin->id,
        'assigned_to' => $this->employee->id,
        'payment_status' => 'unpaid'
    ]);

    // Create the invoice with proper items first
    $this->invoice = Invoice::factory()->create([
        'order_id' => $this->order->id,
        'grand_total' => 1000.00,
        'paid_amount' => 0.00,
        'status' => 'unpaid',
        'vat_percent' => 0,
        'coupon_discount' => 0,
        'subtotal' => 1000.00,
    ]);

    // Add an item that sums to 1000
    $this->invoice->items()->create([
        'service_name' => 'Test Service',
        'unit_price' => 1000.00,
        'quantity' => 1,
        'line_total' => 1000.00,
    ]);

    // Refresh to ensure we have the latest data
    $this->invoice->refresh();
    $this->order->refresh();
}
    

    #[Test]
    public function recording_partial_payment_marks_invoice_partially_paid_and_syncs_order()
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/invoices/{$this->invoice->id}/payments", [
            'amount' => 400,
            'method' => 'bkash'
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('invoice.id', $this->invoice->id)
            ->assertJsonPath('invoice.status', 'partially_paid');

        $this->invoice->refresh();
        $this->assertEquals(400, $this->invoice->paid_amount);
        $this->assertEquals('partially_paid', $this->invoice->status);

        // order payment status should be synced
        $this->order->refresh();
        $this->assertEquals('partially_paid', $this->order->payment_status);
    }

    #[Test]
    public function recording_full_payment_marks_invoice_paid_and_syncs_order()
    {
        Sanctum::actingAs($this->admin);

        // first partial
        $this->postJson("/api/invoices/{$this->invoice->id}/payments", ['amount' => 400]);

        // complete payment
        $response = $this->postJson("/api/invoices/{$this->invoice->id}/payments", ['amount' => 600]);

        $response->assertStatus(200)
            ->assertJsonPath('invoice.status', 'paid');

        $this->invoice->refresh();
        $this->assertEquals(1000, $this->invoice->paid_amount);
        $this->assertEquals('paid', $this->invoice->status);

        $this->order->refresh();
        $this->assertEquals('paid', $this->order->payment_status);
    }

    #[Test]
    public function refund_reduces_paid_amount_and_updates_statuss_and_order()
    {
        Sanctum::actingAs($this->admin);

        // pay full first
        $this->postJson("/api/invoices/{$this->invoice->id}/payments", ['amount' => 1000]);

        $this->invoice->refresh();
        $this->assertEquals('paid', $this->invoice->status);
        $this->order->refresh();
        $this->assertEquals('paid', $this->order->payment_status);

        // refund partially -> becomes partially_paid
        $response = $this->postJson("/api/invoices/{$this->invoice->id}/refunds", ['amount' => 400]);

        $response->assertStatus(200)
            ->assertJsonPath('invoice.status', 'partially_paid');

        $this->invoice->refresh();
        $this->assertEquals(600, $this->invoice->paid_amount);
        $this->assertEquals('partially_paid', $this->invoice->status);

        $this->order->refresh();
        $this->assertEquals('partially_paid', $this->order->payment_status);

        // refund remaining -> becomes unpaid
        $this->postJson("/api/invoices/{$this->invoice->id}/refunds", ['amount' => 600])
            ->assertStatus(200)
            ->assertJsonPath('invoice.status', 'unpaid');

        $this->invoice->refresh();
        $this->assertEquals(0, $this->invoice->paid_amount);
        $this->assertEquals('unpaid', $this->invoice->status);

        $this->order->refresh();
        $this->assertEquals('unpaid', $this->order->payment_status);
    }

    #[Test]
    public function adding_item_to_invoice_recalculates_invoice_and_syncs_order()
    {
        Sanctum::actingAs($this->admin);

        $this->postJson("/api/invoices/{$this->invoice->id}/items", [
                'service_name' => 'Extra work',
                'unit_price' => 200,
                'quantity' => 1
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['item', 'invoice']);

        $this->invoice->refresh();

        // grand_total must have increased (was 1000, now at least 1200)
        $this->assertGreaterThanOrEqual(1200, $this->invoice->grand_total);

        // order payment_status should still be 'unpaid' unless paid_amount >= grand_total
        $this->order->refresh();
        $this->assertEquals('unpaid', $this->order->payment_status);
    }
    
    #[Test]
public function debug_payment_flow()
{
    Sanctum::actingAs($this->admin);

    \Log::info("DEBUG - Initial state", [
        'invoice_id' => $this->invoice->id,
        'paid_amount' => $this->invoice->paid_amount,
        'status' => $this->invoice->status,
        'grand_total' => $this->invoice->grand_total
    ]);

    $response = $this->postJson("/api/invoices/{$this->invoice->id}/payments", [
        'amount' => 400,
        'method' => 'bkash'
    ]);

    $this->invoice->refresh();
    
    \Log::info("DEBUG - After payment", [
        'invoice_id' => $this->invoice->id,
        'paid_amount' => $this->invoice->paid_amount,
        'status' => $this->invoice->status,
        'grand_total' => $this->invoice->grand_total
    ]);

    $this->assertEquals(400, $this->invoice->paid_amount);
    $this->assertEquals('partially_paid', $this->invoice->status);
}
}