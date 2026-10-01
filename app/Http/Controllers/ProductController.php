<?php

namespace App\Http\Controllers;

use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $products = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($request->string('search')->toString(), function ($q, string $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->withCount(['inventoryItems as available_count' => fn ($q) => $q->available()])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('products.index');
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $user = $request->user();

        Product::query()->create([
            ...$request->validated(),
            'store_id' => $user->store_id,
        ]);

        return redirect()
            ->route('products.index')
            ->with('success', 'Marca creada correctamente.');
    }

    public function show(Request $request, Product $product): Response
    {
        $this->ensureStoreAccess($request, $product->store_id);

        $product->loadCount([
            'inventoryItems as available_count' => fn ($q) => $q->available(),
            'inventoryItems',
        ]);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Request $request, Product $product): RedirectResponse
    {
        $this->ensureStoreAccess($request, $product->store_id);

        return redirect()->route('products.index');
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->ensureStoreAccess($request, $product->store_id);

        $product->update($request->validated());

        return redirect()
            ->route('products.index')
            ->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        $this->ensureStoreAccess($request, $product->store_id);

        $product->delete();

        return redirect()
            ->route('products.index')
            ->with('success', 'Producto eliminado.');
    }

    protected function ensureStoreAccess(Request $request, int $storeId): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        abort_unless($user->store_id === $storeId, 403);
    }
}
