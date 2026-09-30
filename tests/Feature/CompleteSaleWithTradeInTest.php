<?php

namespace Tests\Feature;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\SellerIdType;
use App\Enums\UserRole;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Services\Sales\CompleteSaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class CompleteSaleWithTradeInTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_sale_with_trade_in_marks_sold_and_creates_inventory(): void
    {
        Queue::fake();

        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
        ]);

        $saleProduct = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Apple',
            'model' => 'iPhone 14',
        ]);

        $tradeInProduct = Product::factory()->create([
            'store_id' => $store->id,
            'brand' => 'Samsung',
            'model' => 'Galaxy S21',
        ]);

        $sellingItem = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $saleProduct->id,
            'imei' => '111111111111111',
            'cost' => 400.00,
            'min_sale_price' => 500.00,
            'status' => InventoryStatus::Available,
        ]);

        $invoice = app(CompleteSaleService::class)->handle($cashier, [
            'customer_name' => 'María López',
            'customer_phone' => '8095559999',
            'payment_method' => PaymentMethod::Cash->value,
            'items' => [
                [
                    'inventory_item_id' => $sellingItem->id,
                    'sale_price' => 650.00,
                ],
            ],
            'trade_ins' => [
                [
                    'product_id' => $tradeInProduct->id,
                    'imei' => '222222222222222',
                    'serial' => 'TI-001',
                    'condition_grade' => 'B',
                    'battery_health' => 82,
                    'credited_value' => 150.00,
                    'seller_name' => 'María López',
                    'seller_id_type' => SellerIdType::Cedula->value,
                    'seller_id_number' => '00199887766',
                    'seller_phone' => '8095559999',
                    'min_sale_price' => 200.00,
                ],
            ],
        ]);

        $this->assertInstanceOf(Invoice::class, $invoice);
        $this->assertEquals(InvoiceStatus::Completed, $invoice->status);
        $this->assertEquals(650.00, (float) $invoice->subtotal);
        $this->assertEquals(150.00, (float) $invoice->trade_in_credit);
        $this->assertEquals(500.00, (float) $invoice->amount_due);
        $this->assertEquals(1, $invoice->items()->count());
        $this->assertEquals(1, $invoice->tradeIns()->count());

        $sellingItem->refresh();
        $this->assertEquals(InventoryStatus::Sold, $sellingItem->status);

        $tradeInItem = InventoryItem::query()->where('imei', '222222222222222')->first();
        $this->assertNotNull($tradeInItem);
        $this->assertEquals(InventoryStatus::Available, $tradeInItem->status);
        $this->assertEquals(InventoryOrigin::TradeIn, $tradeInItem->origin);
        $this->assertEquals(150.00, (float) $tradeInItem->cost);
        $this->assertEquals($store->id, $tradeInItem->store_id);
    }
}
