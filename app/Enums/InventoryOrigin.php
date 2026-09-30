<?php

namespace App\Enums;

enum InventoryOrigin: string
{
    case Purchase = 'purchase';
    case TradeIn = 'trade_in';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Purchase => 'Compra',
            self::TradeIn => 'Trade-In',
            self::Other => 'Otro',
        };
    }
}
