<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use App\Http\Resources\InvoiceResource;
use App\Jobs\GenerateInvoicePdf;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Services\Documents\GotenbergClient;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class InvoicePrintAndPdfTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /**
     * @return array{store: Store, user: User, invoice: Invoice}
     */
    private function makeInvoice(): array
    {
        $store = Store::factory()->create([
            'warranty_notes' => 'Garantía local de la tienda.',
            'default_print_format' => '80mm',
            'rnc' => '123456789',
            'legal_name' => 'Tienda Demo SRL',
        ]);
        $user = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $user->assignAppRole(UserRole::Cashier);

        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'warranty_months' => 3,
            'warranty_expires_at' => now()->addMonths(3)->toDateString(),
            'sold_at' => now(),
        ]);

        $invoice = Invoice::query()->create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'number' => 'UNI-TEST-0001',
            'customer_name' => 'Cliente',
            'customer_phone' => '8095550000',
            'subtotal' => 1000,
            'trade_in_credit' => 0,
            'amount_due' => 1000,
            'payment_method' => PaymentMethod::Cash,
            'amount_paid' => 1000,
            'status' => InvoiceStatus::Completed,
            'pdf_status' => 'pending',
        ]);

        InvoiceItem::query()->create([
            'invoice_id' => $invoice->id,
            'inventory_item_id' => $item->id,
            'product_name' => $product->name ?? 'iPhone',
            'imei' => $item->imei,
            'sale_price' => 1000,
            'cost_snapshot' => 500,
        ]);

        return compact('store', 'user', 'invoice');
    }

    public function test_invoice_resource_exposes_pdf_url_when_path_exists(): void
    {
        ['user' => $user, 'invoice' => $invoice] = $this->makeInvoice();

        Storage::fake('local');
        Storage::disk('local')->put('invoices/1/UNI-TEST-0001.pdf', 'pdf');
        $invoice->update([
            'pdf_path' => 'invoices/1/UNI-TEST-0001.pdf',
            'pdf_status' => 'ready',
        ]);

        $request = Request::create('/');
        $request->setUserResolver(fn () => $user);

        $payload = (new InvoiceResource($invoice->fresh()))->resolve($request);

        $this->assertSame('ready', $payload['pdf_status']);
        $this->assertNotNull($payload['pdf_url']);
        $this->assertStringContainsString('/pdf', $payload['pdf_url']);
    }

    public function test_print_routes_render_80mm_and_a4_with_warranty(): void
    {
        ['user' => $user, 'invoice' => $invoice] = $this->makeInvoice();

        $this->actingAs($user)
            ->get(route('invoices.print', ['invoice' => $invoice, 'format' => '80mm']))
            ->assertOk()
            ->assertSee('Garantía', false)
            ->assertSee('Garantía local de la tienda.', false)
            ->assertSee($invoice->number, false);

        $this->actingAs($user)
            ->get(route('invoices.print', ['invoice' => $invoice, 'format' => 'a4']))
            ->assertOk()
            ->assertSee('FACTURA', false)
            ->assertSee('RNC: 123456789', false);
    }

    public function test_generate_invoice_pdf_job_marks_ready(): void
    {
        Storage::fake('local');
        ['invoice' => $invoice] = $this->makeInvoice();

        $gotenberg = Mockery::mock(GotenbergClient::class);
        $gotenberg->shouldReceive('htmlToPdf')
            ->once()
            ->andReturn('%PDF-fake');

        $this->app->instance(GotenbergClient::class, $gotenberg);

        (new GenerateInvoicePdf($invoice->id))->handle($gotenberg);

        $invoice->refresh();
        $this->assertSame('ready', $invoice->pdf_status);
        $this->assertNotNull($invoice->pdf_path);
        Storage::disk('local')->assertExists($invoice->pdf_path);
    }

    public function test_pos_sale_sets_auto_print_flash(): void
    {
        Queue::fake();

        $store = Store::factory()->create(['default_print_format' => 'a4']);
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $cashier->assignAppRole(UserRole::Cashier);

        CashSession::factory()->create([
            'store_id' => $store->id,
            'user_id' => $cashier->id,
        ]);

        $product = Product::factory()->create(['store_id' => $store->id]);
        $item = InventoryItem::factory()->create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'min_sale_price' => 100,
            'status' => 'available',
        ]);

        $response = $this->actingAs($cashier)->post('/pos', [
            'customer_name' => 'Ana',
            'payment_method' => PaymentMethod::Cash->value,
            'amount_paid' => 200,
            'items' => [
                [
                    'inventory_item_id' => $item->id,
                    'sale_price' => 200,
                ],
            ],
        ]);

        $invoice = Invoice::query()->first();
        $this->assertNotNull($invoice);
        $response->assertRedirect(route('invoices.show', $invoice));
        $response->assertSessionHas('auto_print', true);
        $response->assertSessionHas('print_format', 'a4');
    }
}
