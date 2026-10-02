<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateStoreSettingsRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $store = $request->user()->store;
        abort_unless($store, 404);
        $this->authorize('update', $store);

        return Inertia::render('Settings/Store', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'code' => $store->code,
                'address' => $store->address,
                'phone' => $store->phone,
                'legal_name' => $store->legal_name,
                'rnc' => $store->rnc,
                'warranty_notes' => $store->warranty_notes,
                'default_print_format' => $store->default_print_format ?? '80mm',
                'logo_url' => $store->logoUrl(),
                'is_active' => $store->is_active,
            ],
        ]);
    }

    public function update(UpdateStoreSettingsRequest $request): RedirectResponse
    {
        $store = $request->user()->store;
        abort_unless($store, 404);
        $this->authorize('update', $store);

        $data = $request->safe()->except(['logo', 'remove_logo']);

        if ($request->boolean('remove_logo') && $store->logo_path) {
            Storage::disk('public')->delete($store->logo_path);
            $data['logo_path'] = null;
        }

        if ($request->hasFile('logo')) {
            if ($store->logo_path) {
                Storage::disk('public')->delete($store->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store(
                "stores/{$store->id}",
                'public',
            );
        }

        $store->update($data);

        return back()->with('success', 'Configuración de tienda actualizada.');
    }
}
