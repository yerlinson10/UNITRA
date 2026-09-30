<?php

namespace Tests\Feature;

use App\Enums\InventoryStatus;
use App\Enums\UserRole;
use App\Http\Resources\InventoryItemResource;
use App\Http\Resources\InvoiceResource;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class CashierCannotSeeCostTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_resource_hides_cost_from_cashier(): void
    {
        $store = Store::factory()->create();

        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
        ]);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
        ]);

        $product = Product::factory()->create(['store_id' => $store->id]);

        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'cost' => 275.50,
            'status' => InventoryStatus::Available,
        ]);

        $cashierRequest = Request::create('/inventory/'.$item->id);
        $cashierRequest->setUserResolver(fn () => $cashier);

        $cashierData = (new InventoryItemResource($item))->resolve($cashierRequest);
        $this->assertArrayNotHasKey('cost', $cashierData);

        $adminRequest = Request::create('/inventory/'.$item->id);
        $adminRequest->setUserResolver(fn () => $admin);

        $adminData = (new InventoryItemResource($item))->resolve($adminRequest);
        $this->assertArrayHasKey('cost', $adminData);
        $this->assertEquals('275.50', (string) $adminData['cost']);
    }

    public function test_invoice_resource_hides_cost_snapshot_from_cashier(): void
    {
        $store = Store::factory()->create();

        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
        ]);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
        ]);

        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'cost' => 200,
        ]);

        $invoice = Invoice::query()->create([
            'store_id' => $store->id,
            'user_id' => $cashier->id,
            'number' => 'UNI-TEST-001',
            'subtotal' => 400,
            'trade_in_credit' => 0,
            'amount_due' => 400,
            'payment_method' => 'cash',
            'amount_paid' => 400,
            'status' => 'completed',
            'ecf_status' => 'not_applicable',
        ]);

        InvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'inventory_item_id' => $item->id,
            'product_name' => $product->name,
            'imei' => $item->imei,
            'sale_price' => 400,
            'cost_snapshot' => 200,
        ]);

        $invoice->load('items');

        $cashierRequest = Request::create('/invoices/'.$invoice->id);
        $cashierRequest->setUserResolver(fn () => $cashier);
        $cashierPayload = (new InvoiceResource($invoice))->resolve($cashierRequest);

        $this->assertNull($cashierPayload['items'][0]['cost_snapshot']);
        $this->assertNull($cashierPayload['items'][0]['margin']);
        $this->assertArrayNotHasKey('gross_margin', $cashierPayload);

        $adminRequest = Request::create('/invoices/'.$invoice->id);
        $adminRequest->setUserResolver(fn () => $admin);
        $adminPayload = (new InvoiceResource($invoice))->resolve($adminRequest);

        $this->assertEquals('200.00', (string) $adminPayload['items'][0]['cost_snapshot']);
        $this->assertEquals(200.0, $adminPayload['items'][0]['margin']);
        $this->assertEquals(200.0, $adminPayload['gross_margin']);
    }

    public function test_cashier_is_forbidden_from_reports(): void
    {
        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($cashier)
            ->get(route('reports.index'))
            ->assertForbidden();
    }
}
