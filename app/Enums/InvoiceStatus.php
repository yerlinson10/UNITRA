<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Completed = 'completed';
    case Void = 'void';

    public function label(): string
    {
        return match ($this) {
            self::Completed => 'Completada',
            self::Void => 'Anulada',
        };
    }
}
