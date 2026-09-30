<?php

namespace App\Enums;

enum CashMovementType: string
{
    case SaleIn = 'sale_in';
    case PurchaseOut = 'purchase_out';
    case AdjustmentIn = 'adjustment_in';
    case AdjustmentOut = 'adjustment_out';

    public function label(): string
    {
        return match ($this) {
            self::SaleIn => 'Ingreso por venta',
            self::PurchaseOut => 'Egreso por compra',
            self::AdjustmentIn => 'Ajuste (entrada)',
            self::AdjustmentOut => 'Ajuste (salida)',
        };
    }

    public function isInbound(): bool
    {
        return in_array($this, [self::SaleIn, self::AdjustmentIn], true);
    }
}
