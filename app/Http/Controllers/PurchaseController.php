<?php

namespace App\Http\Controllers;

use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Models\Product;
use App\Models\Purchase;
use App\Services\Purchases\CreatePurchaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $search = $request->string('search')->toString();

        $purchases = Purchase::query()
            ->with(['user:id,name', 'items'])
            ->withCount('items')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('seller_name', 'like', "%{$search}%")
                        ->orWhere('seller_document', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        if (! $request->user()->canViewCosts()) {
            $purchases->getCollection()->transform(function (Purchase $purchase) {
                $purchase->makeHidden(['total_cost']);
                $purchase->items->each->makeHidden(['cost']);

                return $purchase;
            });
        }

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'filters' => [
                'search' => $search,
            ],
            'canViewCosts' => $request->user()->canViewCosts(),
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $products = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->orderBy('name')
            ->get(['id', 'name', 'brand', 'model', 'storage', 'color']);

        return Inertia::render('Purchases/Create', [
            'products' => $products,
        ]);
    }

    public function store(
        StorePurchaseRequest $request,
        CreatePurchaseService $service,
    ): RedirectResponse {
        try {
            $purchase = $service->handle($request->user(), $request->validated());
        } catch (Throwable $e) {
            return back()
                ->withInput()
                ->with('error', $e->getMessage());
        }

        return redirect()
            ->route('purchases.show', $purchase)
            ->with('success', 'Compra registrada e inventario actualizado.');
    }

    public function show(Request $request, Purchase $purchase): Response
    {
        abort_unless(
            $request->user()->isAdmin() || $request->user()->store_id === $purchase->store_id,
            403,
        );

        $purchase->load(['items.product', 'items.inventoryItem', 'user', 'store']);

        if (! $request->user()->canViewCosts()) {
            $purchase->makeHidden(['total_cost']);
            $purchase->items->each(function ($item) {
                $item->makeHidden(['cost']);
                $item->inventoryItem?->makeHidden(['cost']);
            });
        }

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase,
            'canViewCosts' => $request->user()->canViewCosts(),
        ]);
    }

    public function pdf(Request $request, Purchase $purchase): StreamedResponse
    {
        abort_unless(
            $request->user()->isAdmin() || $request->user()->store_id === $purchase->store_id,
            403,
        );

        abort_unless(
            $purchase->pdf_path && Storage::disk('local')->exists($purchase->pdf_path),
            404,
        );

        return Storage::disk('local')->download($purchase->pdf_path);
    }
}
