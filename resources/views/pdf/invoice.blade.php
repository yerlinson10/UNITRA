<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Factura {{ $invoice->number }}</title>
    <style>
        :root {
            --ink: {{ $brand['ink'] ?? '#111315' }};
            --lime: {{ $brand['lime'] ?? '#B8E34B' }};
            --bg: {{ $brand['background'] ?? '#F5F6F3' }};
            --border: {{ $brand['border'] ?? '#E3E5E0' }};
            --muted: {{ $brand['text_secondary'] ?? '#6B7069' }};
            --text: {{ $brand['text_primary'] ?? '#252925' }};
        }
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Inter, Helvetica, Arial, sans-serif;
            color: var(--text);
            background: #fff;
            font-size: 12px;
            line-height: 1.45;
        }
        .page { padding: 12px 8px; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid var(--ink);
            padding-bottom: 18px;
            margin-bottom: 24px;
            gap: 16px;
        }
        .store-logo {
            max-height: 48px;
            max-width: 140px;
            display: block;
            margin-bottom: 8px;
            object-fit: contain;
        }
        .store-name {
            font-family: "Barlow Condensed", Impact, sans-serif;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: var(--ink);
            margin: 0 0 4px;
        }
        .store-meta {
            color: var(--muted);
            font-size: 11px;
        }
        .doc-meta { text-align: right; }
        .doc-meta h2 {
            margin: 0 0 6px;
            font-family: "Barlow Condensed", Impact, sans-serif;
            font-size: 22px;
            letter-spacing: 0.06em;
            color: var(--ink);
        }
        .lime-bar {
            height: 4px;
            width: 72px;
            background: var(--lime);
            margin: 8px 0 12px auto;
        }
        .grid {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
        }
        .label {
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
            margin-bottom: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        th {
            text-align: left;
            background: var(--bg);
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 10px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
        }
        .imei {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 11px;
        }
        .totals {
            width: 280px;
            margin-left: auto;
        }
        .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
        }
        .totals .due {
            border-top: 2px solid var(--ink);
            margin-top: 8px;
            padding-top: 10px;
            font-size: 16px;
            font-weight: 700;
            color: var(--ink);
        }
        .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
            color: var(--muted);
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
        }
        .warranty-block {
            margin-top: 28px;
            padding: 14px;
            border: 1px solid var(--border);
            background: var(--bg);
        }
        .warranty-title {
            font-family: "Barlow Condensed", Impact, sans-serif;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: var(--ink);
        }
        .warranty-table { margin-bottom: 12px; }
        .warranty-table th, .warranty-table td {
            padding: 6px 8px;
            font-size: 11px;
        }
        .warranty-policy, .warranty-notes {
            margin: 8px 0 0;
            font-size: 10px;
            color: var(--text);
            line-height: 1.5;
        }
        .no-print { margin: 12px 0; }
        @media print {
            .no-print { display: none !important; }
            body { background: #fff; }
        }
    </style>
</head>
<body>
@if(! empty($autoPrint))
<script>window.addEventListener('load', function () { window.print(); });</script>
@endif
<div class="page">
    <div class="no-print" style="text-align:right;">
        <button type="button" onclick="window.print()" style="padding:8px 14px;cursor:pointer;">Imprimir</button>
    </div>

    <div class="header">
        <div>
            @include('pdf.partials.store-header')
        </div>
        <div class="doc-meta">
            <h2>FACTURA</h2>
            <div class="lime-bar"></div>
            <div><strong>{{ $invoice->number }}</strong></div>
            <div>{{ $invoice->created_at?->timezone(config('unitra.timezone'))->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="grid">
        <div>
            <div class="label">Cliente</div>
            <div><strong>{{ $invoice->customer_name ?: 'Cliente general' }}</strong></div>
            <div>{{ $invoice->customer_phone }}</div>
        </div>
        <div>
            <div class="label">Atendido por</div>
            <div>{{ $invoice->user?->name }}</div>
            <div class="label" style="margin-top:10px;">Pago</div>
            <div>{{ $invoice->payment_method?->label() ?? $invoice->payment_method }}</div>
        </div>
    </div>

    <table>
        <thead>
        <tr>
            <th>Equipo</th>
            <th>IMEI</th>
            <th>Garantía</th>
            <th style="text-align:right;">Precio</th>
        </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td class="imei">{{ $item->imei }}</td>
                <td>
                    @php
                        $expires = $item->inventoryItem?->warranty_expires_at;
                    @endphp
                    {{ $expires ? $expires->format('d/m/Y') : '—' }}
                </td>
                <td style="text-align:right;">{{ \App\Support\Money::format($item->sale_price) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    @if($invoice->tradeIns->isNotEmpty())
        <div class="label">Trade-In recibido</div>
        <table>
            <thead>
            <tr>
                <th>IMEI</th>
                <th>Vendedor</th>
                <th style="text-align:right;">Crédito</th>
            </tr>
            </thead>
            <tbody>
            @foreach($invoice->tradeIns as $tradeIn)
                <tr>
                    <td class="imei">{{ $tradeIn->imei }}</td>
                    <td>{{ $tradeIn->seller_name }}</td>
                    <td style="text-align:right;">{{ \App\Support\Money::format($tradeIn->credited_value) }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    @endif

    <div class="totals">
        <div class="row"><span>Subtotal</span><span>{{ \App\Support\Money::format($invoice->subtotal) }}</span></div>
        <div class="row"><span>Crédito Trade-In</span><span>- {{ \App\Support\Money::format($invoice->trade_in_credit) }}</span></div>
        <div class="row due"><span>Monto a pagar</span><span>{{ \App\Support\Money::format($invoice->amount_due) }}</span></div>
        <div class="row"><span>Pagado</span><span>{{ \App\Support\Money::format($invoice->amount_paid) }}</span></div>
    </div>

    @include('pdf.partials.warranty-block')

    <div class="footer">
        <div>{{ $invoice->store?->name ?? config('unitra.name') }} — Conserve este documento como comprobante de garantía.</div>
        <div>e-CF: {{ $invoice->ecf_status?->label() ?? 'No aplica' }}</div>
    </div>
</div>
</body>
</html>
