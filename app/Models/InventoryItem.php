<?php

namespace App\Models;

use App\Enums\InventoryOrigin;
use App\Enums\InventoryStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class InventoryItem extends Model
{
    /** @use HasFactory<\Database\Factories\InventoryItemFactory> */
    use HasFactory;

    protected $fillable = [
        'store_id',
        'product_id',
        'imei',
        'serial',
        'condition_grade',
        'battery_health',
        'cost',
        'min_sale_price',
        'status',
        'origin',
        'purchase_item_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'battery_health' => 'integer',
            'cost' => 'decimal:2',
            'min_sale_price' => 'decimal:2',
            'status' => InventoryStatus::class,
            'origin' => InventoryOrigin::class,
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function invoiceItem(): HasOne
    {
        return $this->hasOne(InvoiceItem::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', InventoryStatus::Available);
    }

    public function scopeForStore(Builder $query, int $storeId): Builder
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeSold(Builder $query): Builder
    {
        return $query->where('status', InventoryStatus::Sold);
    }

    public function isAvailable(): bool
    {
        return $this->status === InventoryStatus::Available;
    }

    public function markSold(): void
    {
        $this->update(['status' => InventoryStatus::Sold]);
    }
}
