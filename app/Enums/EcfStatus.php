<?php

namespace App\Enums;

enum EcfStatus: string
{
    case NotApplicable = 'not_applicable';
    case Pending = 'pending';
    case Sent = 'sent';
    case Accepted = 'accepted';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::NotApplicable => 'No aplica',
            self::Pending => 'Pendiente',
            self::Sent => 'Enviado',
            self::Accepted => 'Aceptado',
            self::Rejected => 'Rechazado',
        };
    }
}
