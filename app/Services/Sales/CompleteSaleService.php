<?php

namespace App\Services\Sales;

use App\Enums\EcfStatus;
use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\SellerIdType;
use App\Jobs\GenerateInvoicePdf;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceTradeIn;
use App\Models\Product;
use App\Models\User;
use App\Services\Cash\CashMovementRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Throwable;

class CompleteSaleService
{
    public function __construct(
        protected CashMovementRecorder $cashMovementRecorder,
    ) {}

    /**
     * @param  array{
     *     customer_name?: string|null,
     *     customer_phone?: string|null,
     *     payment_method: string,
     *     amount_paid?: float|int|string|null,
     *     items: list<array{inventory_item_id: int, sale_price: float|int|string}>,
     *     trade_ins?: list<array{
     *         product_id: int,
     *         imei: string,
     *         serial?: string|null,
     *         condition_grade?: string|null,
     *         battery_health?: int|null,
     *         credited_value: float|int|string,
     *         seller_name: string,
     *         seller_id_type: string,
     *         seller_id_number: string,
     *         seller_phone: string,
     *         min_sale_price?: float|int|string|null,
     *         notes?: string|null
     *     }>
     * }  $data
     *
     * @throws Throwable
     */
    public function handle(User $user, array $data): Invoice
    {
        if (! $user->store_id) {
            throw new InvalidArgumentException('El usuario no tiene una tienda asignada.');
        }

        if (empty($data['items'])) {
            throw new InvalidArgumentException('La venta debe incluir al menos un equipo.');
        }

        $invoice = DB::transaction(function () use ($user, $data) {
            $storeId = (int) $user->store_id;
            $paymentMethod = PaymentMethod::from($data['payment_method']);
            $tradeIns = $data['trade_ins'] ?? [];

            $subtotal = 0.0;
            $lockedItems = [];

            foreach ($data['items'] as $line) {
                /** @var InventoryItem $item */
                $item = InventoryItem::query()
                    ->where('store_id', $storeId)
                    ->whereKey($line['inventory_item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $item->isAvailable()) {
                    throw new InvalidArgumentException(
                        "El equipo IMEI {$item->imei} no está disponible para la venta."
                    );
                }

                $salePrice = (float) $line['sale_price'];

                if ($item->min_sale_price !== null && $salePrice < (float) $item->min_sale_price) {
                    throw new InvalidArgumentException(
                        "El precio de venta para IMEI {$item->imei} está por debajo del mínimo."
                    );
                }

                $item->loadMissing('product');
                $lockedItems[] = [
                    'item' => $item,
                    'sale_price' => $salePrice,
                ];
                $subtotal += $salePrice;
            }

            $tradeInCredit = collect($tradeIns)->sum(
                fn (array $tradeIn) => (float) $tradeIn['credited_value']
            );

            $amountDue = max(0, $subtotal - $tradeInCredit);
            $amountPaid = array_key_exists('amount_paid', $data) && $data['amount_paid'] !== null
                ? (float) $data['amount_paid']
                : $amountDue;

            $invoice = Invoice::query()->create([
                'store_id' => $storeId,
                'user_id' => $user->id,
                'number' => $this->nextInvoiceNumber($storeId),
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'subtotal' => $subtotal,
                'trade_in_credit' => $tradeInCredit,
                'amount_due' => $amountDue,
                'payment_method' => $paymentMethod,
                'amount_paid' => $amountPaid,
                'status' => InvoiceStatus::Completed,
                'ecf_status' => EcfStatus::NotApplicable,
            ]);

            foreach ($lockedItems as $line) {
                /** @var InventoryItem $item */
                $item = $line['item'];

                InvoiceItem::query()->create([
                    'invoice_id' => $invoice->id,
                    'inventory_item_id' => $item->id,
                    'product_name' => $item->product?->name ?? 'Equipo',
                    'imei' => $item->imei,
                    'sale_price' => $line['sale_price'],
                    'cost_snapshot' => $item->cost,
                ]);

                $item->markSold();
            }

            foreach ($tradeIns as $tradeInData) {
                $product = Product::query()
                    ->where('store_id', $storeId)
                    ->findOrFail($tradeInData['product_id']);

                $inventoryItem = InventoryItem::query()->create([
                    'store_id' => $storeId,
                    'product_id' => $product->id,
                    'imei' => $tradeInData['imei'],
                    'serial' => $tradeInData['serial'] ?? null,
                    'condition_grade' => $tradeInData['condition_grade'] ?? null,
                    'battery_health' => $tradeInData['battery_health'] ?? null,
                    'cost' => $tradeInData['credited_value'],
                    'min_sale_price' => $tradeInData['min_sale_price'] ?? null,
                    'purchased_at' => now()->toDateString(),
                    'warranty_months' => $tradeInData['warranty_months'] ?? 3,
                    'warranty_expires_at' => $tradeInData['warranty_expires_at'] ?? null,
                    'status' => InventoryStatus::Available,
                    'origin' => InventoryOrigin::TradeIn,
                    'notes' => $tradeInData['notes'] ?? null,
                ]);

                InvoiceTradeIn::query()->create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'imei' => $tradeInData['imei'],
                    'serial' => $tradeInData['serial'] ?? null,
                    'condition_grade' => $tradeInData['condition_grade'] ?? null,
                    'battery_health' => $tradeInData['battery_health'] ?? null,
                    'credited_value' => $tradeInData['credited_value'],
                    'seller_name' => $tradeInData['seller_name'],
                    'seller_id_type' => SellerIdType::from($tradeInData['seller_id_type']),
                    'seller_id_number' => $tradeInData['seller_id_number'],
                    'seller_phone' => $tradeInData['seller_phone'],
                ]);
            }

            if ($amountPaid > 0) {
                try {
                    $this->cashMovementRecorder->recordSale(
                        $user,
                        $amountPaid,
                        $paymentMethod,
                        $invoice,
                    );
                } catch (InvalidArgumentException) {
                    // Sale can complete without open cash session; cashier can reconcile later.
                }
            }

            return $invoice->load([
                'items.inventoryItem.product',
                'tradeIns.product',
                'tradeIns.inventoryItem',
                'user',
                'store',
            ]);
        });

        GenerateInvoicePdf::dispatch($invoice->id);

        return $invoice;
    }

    protected function nextInvoiceNumber(int $storeId): string
    {
        $prefix = 'UNI-'.now()->format('Ymd').'-'.$storeId.'-';

        do {
            $number = $prefix.Str::upper(Str::random(6));
        } while (Invoice::query()->where('number', $number)->exists());

        return $number;
    }
}
