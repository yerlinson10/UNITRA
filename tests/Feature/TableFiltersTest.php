<?php

namespace Tests\Feature;

use App\Enums\CashSessionStatus;
use App\Enums\SellerIdType;
use App\Enums\UserRole;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TableFiltersTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{store: Store, admin: User}
     */
    private function seedAdmin(): array
    {
        $store = Store::factory()->create();
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);

        return compact('store', 'admin');
    }

    public function test_purchases_index_filters_by_seller_search(): void
    {
        ['store' => $store, 'admin' => $admin] = $this->seedAdmin();

        Purchase::query()->create([
            'store_id' => $store->id,
            'user_id' => $admin->id,
            'seller_name' => 'Juan Pérez',
            'seller_id_type' => SellerIdType::Cedula->value,
            'seller_id_number' => '00111111111',
            'seller_phone' => '8095551111',
            'total_cost' => 100,
        ]);
        Purchase::query()->create([
            'store_id' => $store->id,
            'user_id' => $admin->id,
            'seller_name' => 'María López',
            'seller_id_type' => SellerIdType::Cedula->value,
            'seller_id_number' => '00122222222',
            'seller_phone' => '8095552222',
            'total_cost' => 200,
        ]);

        $this->actingAs($admin)
            ->get(route('purchases.index', ['search' => 'Juan']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchases/Index')
                ->has('purchases.data', 1)
                ->where('purchases.data.0.seller_name', 'Juan Pérez')
                ->where('filters.search', 'Juan')
            );
    }

    public function test_cash_index_filters_sessions_by_status(): void
    {
        ['store' => $store, 'admin' => $admin] = $this->seedAdmin();

        CashSession::factory()->create([
            'store_id' => $store->id,
            'user_id' => $admin->id,
            'status' => CashSessionStatus::Open,
        ]);
        CashSession::factory()->closed()->create([
            'store_id' => $store->id,
            'user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get(route('cash.index', ['status' => 'closed']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Cash/Index')
                ->has('sessions.data', 1)
                ->where('sessions.data.0.status', 'closed')
                ->where('filters.status', 'closed')
            );
    }

    public function test_reports_index_paginates_and_filters_by_search(): void
    {
        ['store' => $store, 'admin' => $admin] = $this->seedAdmin();

        $product = Product::factory()->create(['store_id' => $store->id]);
        $itemA = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '111111111111111',
        ]);
        $itemB = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'imei' => '222222222222222',
        ]);

        $invoice = Invoice::query()->create([
            'store_id' => $store->id,
            'user_id' => $admin->id,
            'number' => 'UNI-RPT-001',
            'subtotal' => 1100,
            'trade_in_credit' => 0,
            'amount_due' => 1100,
            'payment_method' => 'cash',
            'amount_paid' => 1100,
            'status' => 'completed',
            'ecf_status' => 'not_applicable',
        ]);

        InvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'inventory_item_id' => $itemA->id,
            'imei' => '111111111111111',
            'product_name' => 'iPhone 14',
            'sale_price' => 600,
            'cost_snapshot' => 400,
        ]);
        InvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'inventory_item_id' => $itemB->id,
            'imei' => '222222222222222',
            'product_name' => 'Galaxy S23',
            'sale_price' => 500,
            'cost_snapshot' => 350,
        ]);

        $this->actingAs($admin)
            ->get(route('reports.index', ['search' => 'iPhone']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->has('rows.data', 1)
                ->where('rows.data.0.imei', '111111111111111')
                ->where('filters.search', 'iPhone')
                ->where('totals.margin', 200)
            );
    }
}
