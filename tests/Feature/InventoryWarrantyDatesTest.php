<?php

namespace Tests\Feature;

use App\Enums\InventoryStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Services\Sales\CompleteSaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class InventoryWarrantyDatesTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_inventory_unit_persists_purchase_and_warranty_fields(): void
    {
        $store = Store::factory()->create();
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);

        $this->actingAs($user)->post('/inventory', [
            'product_id' => $product->id,
            'imei' => '359111111111111',
            'cost' => 12000,
            'purchased_at' => '2026-01-15',
            'warranty_months' => 6,
            'warranty_expires_at' => '2026-12-31',
        ])->assertRedirect(route('inventory.index'));

        $item = InventoryItem::query()->where('imei', '359111111111111')->first();

        $this->assertNotNull($item);
        $this->assertSame('2026-01-15', $item->purchased_at?->toDateString());
        $this->assertSame(6, $item->warranty_months);
        $this->assertSame('2026-12-31', $item->warranty_expires_at?->toDateString());
        $this->assertNull($item->sold_at);
    }

    public function test_complete_sale_sets_sold_at_and_auto_calculates_warranty_expiry(): void
    {
        Queue::fake();

        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '359222222222222',
            'status' => InventoryStatus::Available,
            'warranty_months' => 3,
            'warranty_expires_at' => null,
            'min_sale_price' => 100,
        ]);

        $invoice = app(CompleteSaleService::class)->handle($cashier, [
            'payment_method' => PaymentMethod::Cash->value,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 200,
                ],
            ],
        ]);

        $item->refresh();

        $this->assertEquals(InvoiceStatus::Completed, $invoice->status);
        $this->assertEquals(InventoryStatus::Sold, $item->status);
        $this->assertNotNull($item->sold_at);
        $this->assertSame(
            $item->sold_at->copy()->addMonths(3)->toDateString(),
            $item->warranty_expires_at?->toDateString(),
        );
    }

    public function test_complete_sale_keeps_manual_warranty_expiry(): void
    {
        Queue::fake();

        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '359333333333333',
            'status' => InventoryStatus::Available,
            'warranty_months' => 3,
            'warranty_expires_at' => '2027-06-01',
            'min_sale_price' => 100,
        ]);

        app(CompleteSaleService::class)->handle($cashier, [
            'payment_method' => PaymentMethod::Cash->value,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 200,
                ],
            ],
        ]);

        $item->refresh();

        $this->assertNotNull($item->sold_at);
        $this->assertSame('2027-06-01', $item->warranty_expires_at?->toDateString());
    }

    public function test_void_invoice_clears_sold_at_and_warranty_expiry(): void
    {
        Queue::fake();

        $store = Store::factory()->create();
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '359444444444444',
            'status' => InventoryStatus::Available,
            'warranty_months' => 3,
            'warranty_expires_at' => null,
            'min_sale_price' => 100,
        ]);

        $invoice = app(CompleteSaleService::class)->handle($admin, [
            'payment_method' => PaymentMethod::Cash->value,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 200,
                ],
            ],
        ]);

        $item->refresh();
        $this->assertNotNull($item->sold_at);
        $this->assertNotNull($item->warranty_expires_at);

        $this->actingAs($admin)
            ->post("/invoices/{$invoice->id}/void", [
                'void_reason' => 'Prueba de anulación',
            ])
            ->assertRedirect();

        $item->refresh();
        $invoice->refresh();

        $this->assertEquals(InvoiceStatus::Void, $invoice->status);
        $this->assertEquals(InventoryStatus::Available, $item->status);
        $this->assertNull($item->sold_at);
        $this->assertNull($item->warranty_expires_at);
    }
}
