<?php

namespace App\Models;

use App\Enums\SellerIdType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceTradeIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'product_id',
        'inventory_item_id',
        'imei',
        'serial',
        'condition_grade',
        'battery_health',
        'credited_value',
        'seller_name',
        'seller_id_type',
        'seller_id_number',
        'seller_phone',
    ];

    protected function casts(): array
    {
        return [
            'battery_health' => 'integer',
            'credited_value' => 'decimal:2',
            'seller_id_type' => SellerIdType::class,
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
