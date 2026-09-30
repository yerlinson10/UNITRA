<?php

namespace App\Http\Controllers;

use App\Enums\InventoryStatus;
use App\Http\Requests\Sales\CompleteSaleRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Services\Sales\CompleteSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        return $this->create($request);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $available = InventoryItem::query()
            ->with('product')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->available()
            ->latest()
            ->limit(50)
            ->get();

        $Marcas = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->orderBy('name')
            ->get(['id', 'name', 'brand', 'model', 'storage', 'color']);

        return Inertia::render('Pos/Index', [
            'availableItems' => InventoryItemResource::collection($available)->resolve(),
            'products' => $Marcas,
            'Marcas' => $Marcas,
            'canViewCosts' => $request->user()->canViewCosts(),
        ]);
    }

    public function store(
        CompleteSaleRequest $request,
        CompleteSaleService $service,
    ): RedirectResponse {
        try {
            $invoice = $service->handle($request->user(), $request->validated());
        } catch (Throwable $e) {
            return back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('invoices.show', $invoice)
            ->with('success', "Venta {$invoice->number} completada.");
    }

    public function lookupImei(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'imei' => ['nullable', 'string', 'max:32'],
        ]);

        $query = trim((string) ($data['q'] ?? $data['imei'] ?? ''));

        if ($query === '') {
            return response()->json(['message' => 'Indica un término de búsqueda.'], 422);
        }

        $storeId = $request->user()->store_id;

        $items = InventoryItem::query()
            ->with('product')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InventoryStatus::Available)
            ->where(function ($q) use ($query) {
                $q->where('imei', 'like', "%{$query}%")
                    ->orWhere('serial', 'like', "%{$query}%")
                    ->orWhere('condition_grade', 'like', "%{$query}%")
                    ->orWhereHas('product', function ($p) use ($query) {
                        $p->where('name', 'like', "%{$query}%")
                            ->orWhere('brand', 'like', "%{$query}%")
                            ->orWhere('model', 'like', "%{$query}%")
                            ->orWhere('storage', 'like', "%{$query}%")
                            ->orWhere('color', 'like', "%{$query}%");
                    });
            })
            ->orderBy('imei')
            ->limit(20)
            ->get();

        if ($items->isEmpty()) {
            return response()->json([
                'message' => 'Sin resultados disponibles.',
                'results' => [],
            ], 404);
        }

        $results = $items->map(fn (InventoryItem $item) => (new InventoryItemResource($item))->resolve())->values();

        // Exact IMEI match → single result convenience for scanners
        $exact = $items->firstWhere('imei', $query);
        if ($exact) {
            return response()->json([
                'exact' => true,
                'item' => (new InventoryItemResource($exact))->resolve(),
                'results' => $results,
            ]);
        }

        return response()->json([
            'exact' => false,
            'results' => $results,
        ]);
    }
}
