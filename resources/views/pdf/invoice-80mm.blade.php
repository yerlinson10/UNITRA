<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Recibo {{ $invoice->number }}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 2mm;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
            color: #111;
            background: #fff;
            width: 72mm;
        }
        .ticket { padding: 4px 2px 12px; }
        .center { text-align: center; }
        .store-logo {
            max-height: 36px;
            max-width: 120px;
            margin: 0 auto 6px;
            display: block;
            object-fit: contain;
        }
        .store-name {
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
        }
        .store-meta { font-size: 10px; }
        .divider {
            border: none;
            border-top: 1px dashed #333;
            margin: 8px 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }
        .muted { color: #444; font-size: 10px; }
        .imei { font-size: 10px; word-break: break-all; }
        .item { margin-bottom: 8px; }
        .item-name { font-weight: 700; }
        .totals .row { margin: 2px 0; }
        .due { font-weight: 700; font-size: 12px; margin-top: 4px; }
        .warranty-title {
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
            font-size: 11px;
        }
        .warranty-policy, .warranty-notes {
            font-size: 9px;
            margin: 6px 0 0;
            text-align: left;
        }
        .warranty-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        .warranty-table th,
        .warranty-table td {
            text-align: left;
            padding: 2px 0;
            vertical-align: top;
        }
        .no-print { margin-bottom: 8px; }
        @media print {
            .no-print { display: none !important; }
            body { width: 72mm; }
        }
    </style>
</head>
<body>
@if(! empty($autoPrint))
<script>window.addEventListener('load', function () { window.print(); });</script>
@endif
<div class="ticket">
    <div class="no-print center">
        <button type="button" onclick="window.print()">Imprimir</button>
    </div>

    <div class="center">
        @include('pdf.partials.store-header')
    </div>

    <hr class="divider">

    <div class="center">
        <strong>FACTURA</strong><br>
        {{ $invoice->number }}<br>
        <span class="muted">{{ $invoice->created_at?->timezone(config('unitra.timezone'))->format('d/m/Y H:i') }}</span>
    </div>

    <hr class="divider">

    <div>
        <div class="muted">Cliente</div>
        <div>{{ $invoice->customer_name ?: 'Cliente general' }}</div>
        @if($invoice->customer_phone)
            <div class="muted">{{ $invoice->customer_phone }}</div>
        @endif
        <div class="muted" style="margin-top:4px;">Cajero: {{ $invoice->user?->name }}</div>
        <div class="muted">Pago: {{ $invoice->payment_method?->label() ?? $invoice->payment_method }}</div>
    </div>

    <hr class="divider">

    @foreach($invoice->items as $item)
        <div class="item">
            <div class="item-name">{{ $item->product_name }}</div>
            <div class="imei">IMEI: {{ $item->imei }}</div>
            <div class="row">
                <span class="muted">
                    @php $expires = $item->inventoryItem?->warranty_expires_at; @endphp
                    Garantía: {{ $expires ? $expires->format('d/m/Y') : '—' }}
                </span>
                <span>{{ \App\Support\Money::format($item->sale_price) }}</span>
            </div>
        </div>
    @endforeach

    @if($invoice->tradeIns->isNotEmpty())
        <hr class="divider">
        <div class="muted">Trade-In</div>
        @foreach($invoice->tradeIns as $tradeIn)
            <div class="row">
                <span class="imei">{{ $tradeIn->imei }}</span>
                <span>- {{ \App\Support\Money::format($tradeIn->credited_value) }}</span>
            </div>
        @endforeach
    @endif

    <hr class="divider">

    <div class="totals">
        <div class="row"><span>Subtotal</span><span>{{ \App\Support\Money::format($invoice->subtotal) }}</span></div>
        <div class="row"><span>Trade-In</span><span>- {{ \App\Support\Money::format($invoice->trade_in_credit) }}</span></div>
        <div class="row due"><span>A pagar</span><span>{{ \App\Support\Money::format($invoice->amount_due) }}</span></div>
        <div class="row"><span>Pagado</span><span>{{ \App\Support\Money::format($invoice->amount_paid) }}</span></div>
    </div>

    <hr class="divider">

    @include('pdf.partials.warranty-block')

    <hr class="divider">
    <div class="center muted">Conserve este recibo como comprobante de garantía.</div>
</div>
</body>
</html>
