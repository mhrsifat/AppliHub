<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Order\Models\Order;
use Modules\Invoice\Models\Invoice;
use Modules\Invoice\Models\InvoicePayment;
use Modules\Invoice\Models\Refund;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;

class OrderInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    #[Test]
    public function guest_can_create_order_and_invoice_is_generated()
    {
        $payload = [
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '01700000000',
            'items' => [
                [
                    'service_name' => 'Web Design',
                    'unit_price' => 2000,
                    'quantity' => 2,
                ],
                [
                    'service_name' => 'Domain Registration',
                    'unit_price' => 1000,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/orders', $payload);
        $response->assertStatus(201);

        $orderData = $response->json('order.data');
        $invoiceData = $response->json('invoice');

        $this->assertNotNull($orderData['id']);
        $this->assertNotNull($invoiceData['id']);
        $this->assertEquals('pending', $orderData['status']);
        $this->assertEquals('unpaid', $invoiceData['status']);
    }

    #[Test]
    public function invoice_payment_updates_status_and_order_syncs()
    {
        $order = Order::factory()->create(['payment_status' => 'unpaid']);
        $invoice = Invoice::factory()->create([
            'order_id' => $order->id,
            'grand_total' => 3000,
            'status' => 'unpaid',
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/payments", [
                'amount' => 3000,
                'method' => 'cash',
            ]);

        $response->assertStatus(200);
        $invoice->refresh();
        $order->refresh();

        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals('paid', $order->payment_status);
    }

    #[Test]
    public function refund_changes_invoice_status_to_partially_paid_or_unpaid()
    {
        $user = User::factory()->create();

        $order = Order::factory()->create(['payment_status' => 'paid']);
        $invoice = Invoice::factory()->create([
            'order_id' => $order->id,
            'grand_total' => 5000,
            'status' => 'paid',
        ]);

        InvoicePayment::factory()->create([
            'invoice_id' => $invoice->id,
            'amount' => 5000,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/invoices/{$invoice->id}/refunds", [
                'amount' => 2000,
                'reason' => 'Partial refund for adjustment',
            ]);

        $response->assertStatus(200);
        $invoice->refresh();

        $this->assertTrue(in_array($invoice->status, ['partially_paid', 'unpaid']));
        $this->assertDatabaseHas('refunds', ['invoice_id' => $invoice->id]);
    }

    #[Test]
    public function can_download_invoice_pdf()
    {
        $invoice = Invoice::factory()->create([
            'invoice_number' => 'INV-TESTPDF',
            'grand_total' => 1000,
        ]);

        $response = $this->get("/api/invoices/{$invoice->id}/pdf");
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }
}