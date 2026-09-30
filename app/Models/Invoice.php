<?php

namespace App\Models;

use App\Enums\EcfStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'user_id',
        'number',
        'customer_name',
        'customer_phone',
        'subtotal',
        'trade_in_credit',
        'amount_due',
        'payment_method',
        'amount_paid',
        'status',
        'ecf_status',
        'ecf_ncf',
        'ecf_payload',
        'ecf_response',
        'pdf_path',
        'pdf_status',
        'voided_at',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'trade_in_credit' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payment_method' => PaymentMethod::class,
            'status' => InvoiceStatus::class,
            'ecf_status' => EcfStatus::class,
            'ecf_payload' => 'array',
            'ecf_response' => 'array',
            'voided_at' => 'datetime',
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
        return $this->hasMany(InvoiceItem::class);
    }

    public function tradeIns(): HasMany
    {
        return $this->hasMany(InvoiceTradeIn::class);
    }

    public function isVoid(): bool
    {
        return $this->status === InvoiceStatus::Void;
    }

    public function grossMargin(): float
    {
        $cost = (float) $this->items->sum('cost_snapshot');
        $revenue = (float) $this->subtotal;

        return $revenue - $cost;
    }
}
