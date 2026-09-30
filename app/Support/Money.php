<?php

namespace App\Support;

class Money
{
    public static function format(float|int|string|null $amount, ?string $currency = null): string
    {
        $currency ??= config('unitra.currency', 'DOP');
        $symbol = config('unitra.currency_symbol', 'RD$');
        $value = number_format((float) $amount, 2, '.', ',');

        return match ($currency) {
            'DOP' => "{$symbol} {$value}",
            default => "{$currency} {$value}",
        };
    }

    public static function toCents(float|int|string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    public static function fromCents(int $cents): float
    {
        return round($cents / 100, 2);
    }
}
