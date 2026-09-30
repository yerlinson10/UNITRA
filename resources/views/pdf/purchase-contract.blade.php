<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Contrato de compra #{{ $purchase->id }} — UNITRA</title>
    <style>
        :root {
            --ink: {{ $brand['ink'] ?? '#111315' }};
            --lime: {{ $brand['lime'] ?? '#B8E34B' }};
            --bg: {{ $brand['background'] ?? '#F5F6F3' }};
            --border: {{ $brand['border'] ?? '#E3E5E0' }};
            --muted: {{ $brand['text_secondary'] ?? '#6B7069' }};
            --text: {{ $brand['text_primary'] ?? '#252925' }};
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Inter, Helvetica, Arial, sans-serif;
            color: var(--text);
            background: #fff;
            font-size: 12px;
            line-height: 1.5;
        }
        .page { padding: 36px 40px; }
        .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 3px solid var(--ink);
            padding-bottom: 18px;
            margin-bottom: 24px;
        }
        .brand-name {
            font-family: "Barlow Condensed", Impact, sans-serif;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.04em;
            margin: 0;
            color: var(--ink);
        }
        .accent {
            width: 64px;
            height: 4px;
            background: var(--lime);
            margin-top: 8px;
        }
        h2 {
            font-family: "Barlow Condensed", Impact, sans-serif;
            letter-spacing: 0.06em;
            color: var(--ink);
            margin: 0 0 8px;
        }
        .label {
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
            margin-bottom: 4px;
        }
        .grid {
            display: flex;
            gap: 32px;
            margin-bottom: 24px;
        }
        .box {
            flex: 1;
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 14px 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0 28px;
        }
        th, td {
            padding: 10px 8px;
            border-bottom: 1px solid var(--border);
            text-align: left;
        }
        th {
            background: var(--bg);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
        }
        .imei { font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
        .legal {
            color: var(--muted);
            font-size: 11px;
            margin-bottom: 40px;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            margin-top: 48px;
        }
        .sign {
            flex: 1;
            text-align: center;
        }
        .sign .line {
            border-top: 1px solid var(--ink);
            margin: 48px 0 8px;
        }
        .total {
            text-align: right;
            font-size: 16px;
            font-weight: 700;
            color: var(--ink);
        }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div>
            <p class="brand-name">UNITRA</p>
            <div class="accent"></div>
            <div style="margin-top:8px;color:var(--muted);font-size:11px;letter-spacing:.12em;text-transform:uppercase;">
                Contrato de compraventa de equipo usado
            </div>
        </div>
        <div style="text-align:right;">
            <h2>COMPRA #{{ $purchase->id }}</h2>
            <div>{{ $purchase->created_at?->timezone(config('unitra.timezone'))->format('d/m/Y H:i') }}</div>
            <div>{{ $purchase->store?->name }}</div>
        </div>
    </div>

    <div class="grid">
        <div class="box">
            <div class="label">Comprador</div>
            <div><strong>{{ $purchase->store?->name }}</strong></div>
            <div>{{ $purchase->store?->address }}</div>
            <div>Representante: {{ $purchase->user?->name }}</div>
        </div>
        <div class="box">
            <div class="label">Vendedor</div>
            <div><strong>{{ $purchase->seller_name }}</strong></div>
            <div>{{ $purchase->seller_id_type?->label() ?? $purchase->seller_id_type }}: {{ $purchase->seller_id_number }}</div>
            <div>Tel: {{ $purchase->seller_phone }}</div>
        </div>
    </div>

    <p class="legal">
        El vendedor declara ser legítimo propietario del(los) equipo(s) descrito(s), libre(s) de gravámenes,
        robos o restricciones legales, y transfiere la propiedad a UNITRA a cambio del monto indicado.
    </p>

    <table>
        <thead>
        <tr>
            <th>Equipo</th>
            <th>IMEI</th>
            <th>Serial</th>
            <th>Condición</th>
            <th>Batería</th>
            <th style="text-align:right;">Costo</th>
        </tr>
        </thead>
        <tbody>
        @foreach($purchase->items as $item)
            <tr>
                <td>{{ $item->product?->name }}</td>
                <td class="imei">{{ $item->imei }}</td>
                <td>{{ $item->serial ?: '—' }}</td>
                <td>{{ $item->condition_grade ?: '—' }}</td>
                <td>{{ $item->battery_health !== null ? $item->battery_health.'%' : '—' }}</td>
                <td style="text-align:right;">{{ \App\Support\Money::format($item->cost) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="total">Total: {{ \App\Support\Money::format($purchase->total_cost) }}</div>

    @if($purchase->notes)
        <div style="margin-top:18px;">
            <div class="label">Notas</div>
            <div>{{ $purchase->notes }}</div>
        </div>
    @endif

    <div class="signatures">
        <div class="sign">
            <div class="line"></div>
            <div>Firma del vendedor</div>
            <div>{{ $purchase->seller_name }}</div>
        </div>
        <div class="sign">
            <div class="line"></div>
            <div>Firma UNITRA</div>
            <div>{{ $purchase->user?->name }}</div>
        </div>
    </div>
</div>
</body>
</html>
