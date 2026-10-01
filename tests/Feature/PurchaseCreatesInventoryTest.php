<?php

namespace Tests\Feature;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Enums\SellerIdType;
use App\Enums\UserRole;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Store;
use App\Models\User;
use App\Services\Purchases\CreatePurchaseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PurchaseCreatesInventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_creates_inventory_items_for_each_line(): void
    {
        Queue::fake();

        $store = Store::factory()->create([
            'name' => 'UNITRA Principal',
            'code' => 'UNI-001',
        ]);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
        ]);

        $product = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 13',
            'storage' => '128GB',
            'color' => 'Black',
        ]);

        $purchase = app(CreatePurchaseService::class)->handle($admin, [
            'seller_name' => 'Juan Pérez',
            'seller_id_type' => SellerIdType::Cedula->value,
            'seller_id_number' => '00112345678',
            'seller_phone' => '8095551234',
            'notes' => 'Compra de prueba',
            'items' => [
                [
                    'product_id' => $product->id,
                    'imei' => '356938035643809',
                    'serial' => 'SN-ABC-001',
                    'condition_grade' => 'A',
                    'battery_health' => 95,
                    'cost' => 350.00,
                    'min_sale_price' => 450.00,
                ],
                [
                    'product_id' => $product->id,
                    'imei' => '356938035643810',
                    'serial' => 'SN-ABC-002',
                    'condition_grade' => 'B',
                    'battery_health' => 88,
                    'cost' => 300.00,
                    'min_sale_price' => 400.00,
                ],
            ],
        ]);

        $this->assertInstanceOf(Purchase::class, $purchase);
        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('purchase_items', 2);
        $this->assertDatabaseCount('inventory_items', 2);

        $this->assertEquals(650.00, (float) $purchase->total_cost);

        $items = InventoryItem::query()->orderBy('imei')->get();

        $this->assertTrue($items->every(fn (InventoryItem $item) => $item->status === InventoryStatus::Available));
        $this->assertTrue($items->every(fn (InventoryItem $item) => $item->origin === InventoryOrigin::Purchase));
        $this->assertTrue($items->every(fn (InventoryItem $item) => $item->store_id === $store->id));
        $this->assertTrue($items->every(fn (InventoryItem $item) => $item->warranty_months === 3));
        $this->assertTrue($items->every(fn (InventoryItem $item) => $item->purchased_at !== null));
        $this->assertEquals(['356938035643809', '356938035643810'], $items->pluck('imei')->all());
    }
}
