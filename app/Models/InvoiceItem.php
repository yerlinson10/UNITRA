<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'inventory_item_id',
        'product_name',
        'imei',
        'sale_price',
        'cost_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'sale_price' => 'decimal:2',
            'cost_snapshot' => 'decimal:2',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function margin(): float
    {
        return (float) $this->sale_price - (float) $this->cost_snapshot;
    }
}
