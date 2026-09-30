<?php

namespace App\Http\Controllers;

use App\Enums\InventoryStatus;
use App\Http\Requests\Inventory\StoreInventoryItemRequest;
use App\Http\Requests\Inventory\UpdateInventoryStatusRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Services\Inventory\StoreInventoryUnitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryItemController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', InventoryItem::class);

        $storeId = $request->user()->store_id;
        $canViewCosts = $request->user()->canViewCosts();
        $search = $request->string('search')->toString();

        $items = InventoryItem::query()
            ->with('product')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('imei', 'like', "%{$search}%")
                        ->orWhere('serial', 'like', "%{$search}%")
                        ->orWhere('condition_grade', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($p) use ($search) {
                            $p->where('name', 'like', "%{$search}%")
                                ->orWhere('brand', 'like', "%{$search}%")
                                ->orWhere('model', 'like', "%{$search}%")
                                ->orWhere('storage', 'like', "%{$search}%")
                                ->orWhere('color', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $payload = $items->through(function (InventoryItem $item) use ($canViewCosts) {
            $data = (new InventoryItemResource($item))->resolve();

            if (! $canViewCosts) {
                $data['cost'] = null;
            }

            return $data;
        });

        $Marcas = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->orderBy('name')
            ->get(['id', 'name', 'brand', 'model', 'storage', 'color']);

        return Inertia::render('Inventory/Index', [
            'items' => $payload,
            'Marcas' => $Marcas,
            'filters' => [
                'search' => $search,
                'status' => $request->string('status')->toString(),
            ],
            'statuses' => collect(InventoryStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'canViewCosts' => $canViewCosts,
        ]);
    }

    public function create(): RedirectResponse
    {
        $this->authorize('create', InventoryItem::class);

        return redirect()->route('inventory.index');
    }

    public function store(
        StoreInventoryItemRequest $request,
        StoreInventoryUnitService $service,
    ): RedirectResponse {
        $this->authorize('create', InventoryItem::class);

        $service->handle($request->user(), $request->validated());

        return redirect()
            ->route('inventory.index')
            ->with('success', 'Producto agregado al inventario.');
    }

    public function show(Request $request, InventoryItem $inventoryItem): Response
    {
        $this->authorize('view', $inventoryItem);

        $inventoryItem->load(['product', 'purchaseItem.purchase', 'invoiceItem.invoice']);

        return Inertia::render('Inventory/Show', [
            'item' => (new InventoryItemResource($inventoryItem))->resolve(),
            'canViewCosts' => $request->user()->canViewCosts(),
        ]);
    }

    public function updateStatus(
        UpdateInventoryStatusRequest $request,
        InventoryItem $inventoryItem,
    ): RedirectResponse {
        $this->authorize('update', $inventoryItem);

        $status = InventoryStatus::from($request->validated('status'));

        if ($inventoryItem->status === InventoryStatus::Sold && $status !== InventoryStatus::Sold) {
            abort_unless($request->user()->isAdmin(), 403, 'Solo un administrador puede revertir un equipo vendido.');
        }

        $inventoryItem->update([
            'status' => $status,
            'notes' => $request->validated('notes') ?? $inventoryItem->notes,
        ]);

        return back()->with('success', 'Estado actualizado.');
    }
}
