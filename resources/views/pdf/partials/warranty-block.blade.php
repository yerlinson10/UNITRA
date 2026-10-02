@php
    $warrantyPolicy = config('unitra.warranty_policy');
    $warrantyNotes = $invoice->store?->warranty_notes;
@endphp

<div class="warranty-block">
    <div class="warranty-title">Garantía</div>
    <table class="warranty-table">
        <thead>
        <tr>
            <th>Equipo</th>
            <th>IMEI</th>
            <th>Meses</th>
            <th>Vence</th>
        </tr>
        </thead>
        <tbody>
        @foreach($invoice->items as $item)
            @php
                $inv = $item->inventoryItem;
                $expires = $inv?->warranty_expires_at;
                $months = $inv?->warranty_months;
            @endphp
            <tr>
                <td>{{ $item->product_name }}</td>
                <td class="imei">{{ $item->imei }}</td>
                <td>{{ $months !== null ? $months : '—' }}</td>
                <td>{{ $expires ? $expires->format('d/m/Y') : '—' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
    <p class="warranty-policy">{{ $warrantyPolicy }}</p>
    @if($warrantyNotes)
        <p class="warranty-notes"><strong>Notas de la tienda:</strong> {{ $warrantyNotes }}</p>
    @endif
</div>
