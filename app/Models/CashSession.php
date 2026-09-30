<?php

namespace App\Models;

use App\Enums\CashSessionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'user_id',
        'opened_at',
        'closed_at',
        'opening_amount',
        'closing_amount',
        'expected_amount',
        'difference',
        'notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_amount' => 'decimal:2',
            'closing_amount' => 'decimal:2',
            'expected_amount' => 'decimal:2',
            'difference' => 'decimal:2',
            'status' => CashSessionStatus::class,
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

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }

    public function isOpen(): bool
    {
        return $this->status === CashSessionStatus::Open;
    }

    public function calculateExpectedAmount(): float
    {
        $inbound = (float) $this->movements()
            ->whereIn('type', ['sale_in', 'adjustment_in'])
            ->sum('amount');

        $outbound = (float) $this->movements()
            ->whereIn('type', ['purchase_out', 'adjustment_out'])
            ->sum('amount');

        return (float) $this->opening_amount + $inbound - $outbound;
    }
}
