@php
    $store = $invoice->store;
    $storeName = $store?->legal_name ?: $store?->name ?: config('unitra.name');
    $logoUrl = ! empty($store?->logo_path) ? \Illuminate\Support\Facades\Storage::disk('public')->url($store->logo_path) : null;
@endphp

@if($logoUrl)
    <img src="{{ $logoUrl }}" alt="{{ $storeName }}" class="store-logo">
@endif
<div class="store-name">{{ $storeName }}</div>
@if($store?->rnc)
    <div class="store-meta">RNC: {{ $store->rnc }}</div>
@endif
@if($store?->address)
    <div class="store-meta">{{ $store->address }}</div>
@endif
@if($store?->phone)
    <div class="store-meta">Tel: {{ $store->phone }}</div>
@endif
