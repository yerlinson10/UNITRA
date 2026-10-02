<?php

namespace Tests\Feature;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Enums\PaymentMethod;
use App\Enums\SellerIdType;
use App\Enums\UserRole;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PosSaleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{store: Store, cashier: User, item: InventoryItem, product: Product}
     */
    private function seedPosSale(float $minSalePrice = 500.00): array
    {
        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $product = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 14',
        ]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '111111111111111',
            'cost' => 400.00,
            'min_sale_price' => $minSalePrice,
            'status' => InventoryStatus::Available,
        ]);

        return compact('store', 'cashier', 'item', 'product');
    }

    private function openCash(User $cashier, Store $store): CashSession
    {
        return CashSession::factory()->create([
            'store_id' => $store->id,
            'user_id' => $cashier->id,
        ]);
    }

    public function test_pos_store_completes_sale_and_redirects_to_invoice(): void
    {
        Queue::fake();

        ['store' => $store, 'cashier' => $cashier, 'item' => $item] = $this->seedPosSale();
        $this->openCash($cashier, $store);

        $response = $this->actingAs($cashier)->post('/pos', [
            'customer_name' => 'Ana Pérez',
            'customer_phone' => '8095551111',
            'payment_method' => PaymentMethod::Cash->value,
            'amount_paid' => 650.00,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 650.00,
                ],
            ],
        ]);

        $invoice = Invoice::query()->first();
        $this->assertNotNull($invoice);
        $response->assertRedirect(route('invoices.show', $invoice));
        $response->assertSessionHas('success');

        $item->refresh();
        $this->assertSame(InventoryStatus::Sold, $item->status);
        $this->assertDatabaseHas('cash_movements', [
            'reference_id' => $invoice->id,
            'amount' => 650.00,
        ]);
    }

    public function test_pos_store_rejects_sale_without_open_cash_session(): void
    {
        Queue::fake();

        ['cashier' => $cashier, 'item' => $item] = $this->seedPosSale();

        $response = $this->actingAs($cashier)->from('/pos')->post('/pos', [
            'payment_method' => PaymentMethod::Cash->value,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 650.00,
                ],
            ],
        ]);

        $response->assertRedirect('/pos');
        $response->assertSessionHas('error');
        $this->assertStringContainsString(
            'caja abierta',
            (string) session('error'),
        );
        $this->assertSame(0, Invoice::query()->count());
        $item->refresh();
        $this->assertSame(InventoryStatus::Available, $item->status);
    }

    public function test_pos_store_rejects_price_below_minimum(): void
    {
        Queue::fake();

        ['store' => $store, 'cashier' => $cashier, 'item' => $item] = $this->seedPosSale(500.00);
        $this->openCash($cashier, $store);

        $response = $this->actingAs($cashier)->from('/pos')->post('/pos', [
            'payment_method' => PaymentMethod::Card->value,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 400.00,
                ],
            ],
        ]);

        $response->assertRedirect('/pos');
        $response->assertSessionHas('error');
        $this->assertStringContainsString(
            'mínimo',
            (string) session('error'),
        );
        $this->assertSame(0, Invoice::query()->count());
    }

    public function test_pos_store_accepts_trade_in_with_serial_and_battery(): void
    {
        Queue::fake();

        ['store' => $store, 'cashier' => $cashier, 'item' => $item] = $this->seedPosSale();
        $this->openCash($cashier, $store);

        $tradeInProduct = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Samsung',
            'model' => 'Galaxy S21',
        ]);

        $response = $this->actingAs($cashier)->post('/pos', [
            'payment_method' => PaymentMethod::Transfer->value,
            'amount_paid' => 500.00,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 650.00,
                ],
            ],
            'trade_ins' => [
                [
                    'product_id' => $tradeInProduct->id,
                    'imei' => '222222222222222',
                    'serial' => 'TI-SER-99',
                    'condition_grade' => 'Grado B',
                    'battery_health' => 88,
                    'credited_value' => 150.00,
                    'min_sale_price' => 200.00,
                    'notes' => 'Pantalla impecable',
                    'seller_name' => 'Carlos Díaz',
                    'seller_id_type' => SellerIdType::Cedula->value,
                    'seller_id_number' => '00111222333',
                    'seller_phone' => '8095552222',
                ],
            ],
        ]);

        $invoice = Invoice::query()->first();
        $this->assertNotNull($invoice);
        $response->assertRedirect(route('invoices.show', $invoice));

        $tradeInItem = InventoryItem::query()->where('imei', '222222222222222')->first();
        $this->assertNotNull($tradeInItem);
        $this->assertSame(InventoryStatus::Available, $tradeInItem->status);
        $this->assertSame(InventoryOrigin::TradeIn, $tradeInItem->origin);
        $this->assertSame('TI-SER-99', $tradeInItem->serial);
        $this->assertSame(88, $tradeInItem->battery_health);
        $this->assertSame('Grado B', $tradeInItem->condition_grade);
        $this->assertEquals(200.00, (float) $tradeInItem->min_sale_price);
        $this->assertSame(1, CashMovement::query()->count());
    }

    public function test_pos_lookup_returns_exact_imei_match(): void
    {
        ['cashier' => $cashier, 'item' => $item] = $this->seedPosSale();

        $this->actingAs($cashier)
            ->getJson('/pos/lookup?q='.$item->imei)
            ->assertOk()
            ->assertJsonPath('exact', true)
            ->assertJsonPath('item.imei', $item->imei);
    }

    public function test_pos_lookup_by_name_is_case_insensitive_and_not_exact(): void
    {
        ['store' => $store, 'cashier' => $cashier] = $this->seedPosSale();

        $product = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 15',
            'name' => 'Apple iPhone 15 128GB Black',
        ]);

        InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '359999999999001',
            'status' => InventoryStatus::Available,
        ]);

        $this->actingAs($cashier)
            ->getJson('/pos/lookup?q=iphone 15')
            ->assertOk()
            ->assertJsonPath('exact', false)
            ->assertJsonFragment(['imei' => '359999999999001']);
    }

    public function test_pos_lookup_tolerates_typos_without_auto_select(): void
    {
        ['store' => $store, 'cashier' => $cashier] = $this->seedPosSale();

        $product = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 15',
            'name' => 'Apple iPhone 15 128GB Black',
        ]);

        InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '359999999999002',
            'status' => InventoryStatus::Available,
        ]);

        $this->actingAs($cashier)
            ->getJson('/pos/lookup?q=iphne 15')
            ->assertOk()
            ->assertJsonPath('exact', false)
            ->assertJsonFragment(['imei' => '359999999999002']);
    }

    public function test_pos_available_endpoint_paginates_and_uses_cache_invalidation(): void
    {
        ['store' => $store, 'cashier' => $cashier, 'item' => $item] = $this->seedPosSale();

        $first = $this->actingAs($cashier)
            ->getJson('/pos/available?page=1')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonFragment(['imei' => $item->imei]);

        InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $item->product_id,
            'imei' => '359999999999099',
            'status' => InventoryStatus::Available,
        ]);

        $this->actingAs($cashier)
            ->getJson('/pos/available?page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['imei' => '359999999999099']);

        $this->assertNotNull($first->json('data'));
    }

    public function test_pos_index_exposes_cash_session_without_bulk_available_items(): void
    {
        ['store' => $store, 'cashier' => $cashier] = $this->seedPosSale();
        $this->openCash($cashier, $store);

        $this->actingAs($cashier)
            ->get('/pos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Pos/Index')
                ->where('cashSessionOpen', true)
                ->missing('availableItems')
                ->missing('Marcas')
            );
    }
}
