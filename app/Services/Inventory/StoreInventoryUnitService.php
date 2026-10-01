<?php

namespace App\Services\Inventory;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreInventoryUnitService
{
    /**
     * @param  array{
     *   product_id?: int|null,
     *   brand?: string|null,
     *   model?: string|null,
     *   storage?: string|null,
     *   color?: string|null,
     *   imei: string,
     *   serial?: string|null,
     *   condition_grade?: string|null,
     *   battery_health?: int|null,
     *   cost: float|int|string,
     *   min_sale_price?: float|int|string|null,
     *   purchased_at?: string|null,
     *   warranty_months?: int|null,
     *   warranty_expires_at?: string|null,
     *   notes?: string|null,
     *   origin?: string|null
     * }  $data
     */
    public function handle(User $user, array $data): InventoryItem
    {
        abort_unless($user->store_id, 422, 'El usuario no tiene tienda asignada.');

        return DB::transaction(function () use ($user, $data) {
            $product = $this->resolveMarca($user->store_id, $data);

            $exists = InventoryItem::query()
                ->where('store_id', $user->store_id)
                ->where('imei', $data['imei'])
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'imei' => 'Ya existe una unidad con este IMEI en la tienda.',
                ]);
            }

            return InventoryItem::query()->create([
                'store_id' => $user->store_id,
                'product_id' => $product->id,
                'imei' => $data['imei'],
                'serial' => $data['serial'] ?? null,
                'condition_grade' => $data['condition_grade'] ?? null,
                'battery_health' => $data['battery_health'] ?? null,
                'cost' => $data['cost'],
                'min_sale_price' => $data['min_sale_price'] ?? null,
                'purchased_at' => $data['purchased_at'] ?? now()->toDateString(),
                'warranty_months' => $data['warranty_months'] ?? 3,
                'warranty_expires_at' => $data['warranty_expires_at'] ?? null,
                'status' => InventoryStatus::Available,
                'origin' => InventoryOrigin::tryFrom($data['origin'] ?? 'other') ?? InventoryOrigin::Other,
                'notes' => $data['notes'] ?? null,
            ])->load('product');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveMarca(int $storeId, array $data): Product
    {
        if (! empty($data['product_id'])) {
            $product = Product::query()
                ->where('store_id', $storeId)
                ->whereKey($data['product_id'])
                ->first();

            if (! $product) {
                throw ValidationException::withMessages([
                    'product_id' => 'La Marca seleccionada no existe.',
                ]);
            }

            return $product;
        }

        $brand = trim((string) ($data['brand'] ?? ''));
        $model = trim((string) ($data['model'] ?? ''));

        if ($brand === '' || $model === '') {
            throw ValidationException::withMessages([
                'brand' => 'Indica una Marca existente o marca y modelo nuevos.',
                'model' => 'Indica una Marca existente o marca y modelo nuevos.',
            ]);
        }

        $storage = isset($data['storage']) && $data['storage'] !== '' ? trim((string) $data['storage']) : null;
        $color = isset($data['color']) && $data['color'] !== '' ? trim((string) $data['color']) : null;

        $existing = Product::query()
            ->where('store_id', $storeId)
            ->where('brand', $brand)
            ->where('model', $model)
            ->where(fn ($q) => $storage === null ? $q->whereNull('storage') : $q->where('storage', $storage))
            ->where(fn ($q) => $color === null ? $q->whereNull('color') : $q->where('color', $color))
            ->first();

        if ($existing) {
            return $existing;
        }

        return Product::query()->create([
            'store_id' => $storeId,
            'brand' => $brand,
            'model' => $model,
            'storage' => $storage,
            'color' => $color,
            'name' => Product::buildName($brand, $model, $storage, $color),
        ]);
    }
}
