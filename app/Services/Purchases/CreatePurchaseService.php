<?php

namespace App\Services\Purchases;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Enums\SellerIdType;
use App\Jobs\GeneratePurchaseContractPdf;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\User;
use App\Services\Cash\CashMovementRecorder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class CreatePurchaseService
{
    public function __construct(
        protected CashMovementRecorder $cashMovementRecorder,
    ) {}

    /**
     * @param  array{
     *     seller_name: string,
     *     seller_id_type: string,
     *     seller_id_number: string,
     *     seller_phone: string,
     *     notes?: string|null,
     *     items: list<array{
     *         product_id: int,
     *         imei: string,
     *         serial?: string|null,
     *         condition_grade?: string|null,
     *         battery_health?: int|null,
     *         cost: float|int|string,
     *         min_sale_price?: float|int|string|null,
     *         notes?: string|null
     *     }>
     * }  $data
     *
     * @throws Throwable
     */
    public function handle(User $user, array $data): Purchase
    {
        if (! $user->store_id) {
            throw new InvalidArgumentException('El usuario no tiene una tienda asignada.');
        }

        if (empty($data['items'])) {
            throw new InvalidArgumentException('La compra debe incluir al menos un equipo.');
        }

        $purchase = DB::transaction(function () use ($user, $data) {
            $storeId = (int) $user->store_id;
            $totalCost = collect($data['items'])->sum(fn (array $item) => (float) $item['cost']);

            $purchase = Purchase::query()->create([
                'store_id' => $storeId,
                'user_id' => $user->id,
                'seller_name' => $data['seller_name'],
                'seller_id_type' => SellerIdType::from($data['seller_id_type']),
                'seller_id_number' => $data['seller_id_number'],
                'seller_phone' => $data['seller_phone'],
                'total_cost' => $totalCost,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $itemData) {
                $product = Product::query()
                    ->where('store_id', $storeId)
                    ->findOrFail($itemData['product_id']);

                $purchaseItem = PurchaseItem::query()->create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'imei' => $itemData['imei'],
                    'serial' => $itemData['serial'] ?? null,
                    'condition_grade' => $itemData['condition_grade'] ?? null,
                    'battery_health' => $itemData['battery_health'] ?? null,
                    'cost' => $itemData['cost'],
                ]);

                $inventoryItem = InventoryItem::query()->create([
                    'store_id' => $storeId,
                    'product_id' => $product->id,
                    'imei' => $itemData['imei'],
                    'serial' => $itemData['serial'] ?? null,
                    'condition_grade' => $itemData['condition_grade'] ?? null,
                    'battery_health' => $itemData['battery_health'] ?? null,
                    'cost' => $itemData['cost'],
                    'min_sale_price' => $itemData['min_sale_price'] ?? null,
                    'purchased_at' => $purchase->created_at?->toDateString() ?? now()->toDateString(),
                    'warranty_months' => $itemData['warranty_months'] ?? 3,
                    'warranty_expires_at' => $itemData['warranty_expires_at'] ?? null,
                    'status' => InventoryStatus::Available,
                    'origin' => InventoryOrigin::Purchase,
                    'purchase_item_id' => $purchaseItem->id,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $purchaseItem->update(['inventory_item_id' => $inventoryItem->id]);
            }

            try {
                $this->cashMovementRecorder->recordPurchase($user, (float) $totalCost, $purchase);
            } catch (InvalidArgumentException) {
                // Allow purchases without an open cash session (e.g. seed/admin flows).
            }

            return $purchase->load(['items.product', 'items.inventoryItem', 'user', 'store']);
        });

        GeneratePurchaseContractPdf::dispatch($purchase->id);

        return $purchase;
    }
}
