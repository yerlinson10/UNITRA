<?php

namespace App\Enums;

enum SellerIdType: string
{
    case Cedula = 'cedula';
    case Pasaporte = 'pasaporte';

    public function label(): string
    {
        return match ($this) {
            self::Cedula => 'Cédula',
            self::Pasaporte => 'Pasaporte',
        };
    }
}
