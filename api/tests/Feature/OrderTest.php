<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Order\Models\Order;
use Modules\Order\Models\OrderItem;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    #[Test]
public function authenticated_user_can_create_order()
{
    $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/orders', [
        'customer_name' => 'John Doe',
        'vat_percent' => 15,
        'coupon_code' => null,
        'items' => [
            ['service_id' => 1, 'service_name' => 'Web Design', 'unit_price' => 500, 'quantity' => 2],
            ['service_id' => 2, 'service_name' => 'SEO', 'unit_price' => 700, 'quantity' => 1],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'order' => [
                'id',
                'total',
                'grand_total',
            ],
        ]);

    $this->assertDatabaseCount('orders', 1);
    $this->assertDatabaseCount('order_items', 2);
}

    #[Test]
    public function user_can_update_order_item()
    {
        $order = Order::factory()
            ->has(OrderItem::factory()->state([
                'service_name' => 'Initial Service',
                'unit_price' => 100,
                'quantity' => 1,
            ]), 'items')
            ->create();

        $item = $order->items->first();

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/orders/{$order->id}/items/{$item->id}", [
                'quantity' => 5,
                'service_name' => 'Initial Service',
                'unit_price' => 100,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('order_items', [
            'id' => $item->id,
            'quantity' => 5,
        ]);
    }

    #[Test]
    public function user_can_delete_order()
    {
        $order = Order::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/orders/{$order->id}");

        // Controller returns: ['message' => 'Order deleted.']
        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Order deleted.']);

        $this->assertDatabaseMissing('orders', [
            'id' => $order->id,
        ]);
    }
}