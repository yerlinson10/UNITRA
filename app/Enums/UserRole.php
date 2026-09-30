<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Cashier = 'cashier';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Cashier => 'Cajero',
        };
    }

    public function canViewCosts(): bool
    {
        return $this === self::Admin;
    }
}
