<?php

namespace App\Models;

use App\Enums\SellerIdType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'user_id',
        'seller_name',
        'seller_id_type',
        'seller_id_number',
        'seller_phone',
        'total_cost',
        'notes',
        'pdf_path',
        'pdf_status',
    ];

    protected function casts(): array
    {
        return [
            'seller_id_type' => SellerIdType::class,
            'total_cost' => 'decimal:2',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
