<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use Modules\Invoice\Models\Invoice;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }
    
    #[Test]
    public function it_can_create_invoice_from_order()
    {
        $order = Order::factory()->has(
            OrderItem::factory()->count(2)->state([
                'service_name' => 'Service A',
                'unit_price' => 200,
                'quantity' => 1,
            ]),
            'items'
        )->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/invoices", []); // fallback to order items

        $response->assertStatus(201)
            ->assertJsonStructure([
                'invoice' => ['id', 'grand_total', 'status'], // ✅ fixed
            ]);

        $this->assertDatabaseCount('invoices', 1);
    }

    #[Test]
    public function it_can_record_payment_against_invoice()
    {
        $invoice = Invoice::factory()->create(['paid_amount' => 0]); // must exist

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/payments", [
                'amount' => 400
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Payment recorded successfully']);
    }

    #[Test]
    public function it_can_refund_invoice_partially()
    {
        $invoice = Invoice::factory()->create(['paid_amount' => 800]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/refunds", [
                'amount' => 200
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Refund processed successfully']);
    }
}