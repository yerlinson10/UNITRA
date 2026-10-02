<?php

namespace App\Http\Controllers;

use App\Enums\CashSessionStatus;
use App\Http\Requests\Sales\CompleteSaleRequest;
use App\Models\CashSession;
use App\Models\Product;
use App\Services\Pos\PosAvailableInventoryCache;
use App\Services\Pos\PosLookupService;
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

        $products = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->orderBy('name')
            ->get(['id', 'name', 'brand', 'model', 'storage', 'color']);

        $cashSessionOpen = $storeId
            ? CashSession::query()
                ->where('store_id', $storeId)
                ->where('status', CashSessionStatus::Open)
                ->exists()
            : false;

        return Inertia::render('Pos/Index', [
            'products' => $products,
            'canViewCosts' => $request->user()->canViewCosts(),
            'cashSessionOpen' => $cashSessionOpen,
        ]);
    }

    public function available(
        Request $request,
        PosAvailableInventoryCache $cache,
    ): JsonResponse {
        $data = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $page = (int) ($data['page'] ?? 1);
        $payload = $cache->page(
            $request->user()->store_id,
            $page,
            $request->user(),
            $request,
        );

        return response()->json($payload);
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

    public function lookupImei(Request $request, PosLookupService $lookup): JsonResponse
    {
        $data = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'imei' => ['nullable', 'string', 'max:32'],
        ]);

        $query = trim((string) ($data['q'] ?? $data['imei'] ?? ''));
        $payload = $lookup->search($request->user(), $query, $request);

        if ($query === '') {
            return response()->json($payload, 422);
        }

        if (($payload['results'] ?? []) === [] && ! ($payload['exact'] ?? false)) {
            return response()->json($payload, 404);
        }

        return response()->json($payload);
    }
}
