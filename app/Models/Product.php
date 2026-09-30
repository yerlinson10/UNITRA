<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'store_id',
        'brand',
        'model',
        'storage',
        'color',
        'name',
        'sku',
    ];

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            $product->name = $product->buildDisplayName();
        });
    }

    public function buildDisplayName(): string
    {
        $parts = array_filter([
            $this->brand,
            $this->model,
            $this->storage,
            $this->color,
        ]);

        return implode(' ', $parts);
    }

    public static function buildName(
        string $brand,
        string $model,
        ?string $storage = null,
        ?string $color = null,
    ): string {
        return collect([$brand, $model, $storage, $color])->filter()->implode(' ');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
