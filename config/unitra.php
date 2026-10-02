<?php

return [

    'name' => env('APP_NAME', 'UNITRA'),

    'currency' => env('UNITRA_CURRENCY', 'DOP'),

    'currency_symbol' => env('UNITRA_CURRENCY_SYMBOL', 'RD$'),

    'locale' => env('APP_LOCALE', 'es'),

    'timezone' => env('APP_TIMEZONE', 'America/Santo_Domingo'),

    'brand' => [
        'ink' => '#111315',
        'lime' => '#B8E34B',
        'background' => '#F5F6F3',
        'surface' => '#FFFFFF',
        'border' => '#E3E5E0',
        'text_secondary' => '#6B7069',
        'text_primary' => '#252925',
        'success' => '#22A06B',
        'warning' => '#D97706',
        'danger' => '#DC4444',
    ],

    'warranty_policy' => 'La garantía cubre defectos de fabricación durante el período indicado por cada equipo. No cubre daños por agua, golpes, mal uso, intervención de terceros ni accesorios. Para reclamos presente esta factura e IMEI del equipo.',

];
