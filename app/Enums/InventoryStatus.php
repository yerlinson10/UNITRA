<?php

namespace App\Enums;

enum InventoryStatus: string
{
    case Available = 'available';
    case Sold = 'sold';
    case InRepair = 'in_repair';
    case Returned = 'returned';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Disponible',
            self::Sold => 'Vendido',
            self::InRepair => 'En reparación',
            self::Returned => 'Devuelto',
        };
    }
}
