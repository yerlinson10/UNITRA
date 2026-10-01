<?php

namespace App\Http\Controllers;

use App\Enums\InventoryStatus;
use App\Enums\InvoiceStatus;
use App\Http\Requests\Invoices\VoidInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Invoice::class);

        $storeId = $request->user()->store_id;

        $invoices = Invoice::query()
            ->with(['user:id,name', 'items'])
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->string('search')->toString(), function ($q, string $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $payload = $invoices->through(
            fn (Invoice $invoice) => (new InvoiceResource($invoice))->resolve()
        );

        return Inertia::render('Invoices/Index', [
            'invoices' => $payload,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'canViewCosts' => $request->user()->canViewCosts(),
        ]);
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        $this->authorize('view', $invoice);

        $invoice->load(['items.inventoryItem.product', 'tradeIns.product', 'user', 'store']);

        return Inertia::render('Invoices/Show', [
            'invoice' => (new InvoiceResource($invoice))->resolve(),
            'canViewCosts' => $request->user()->canViewCosts(),
            'canVoid' => $request->user()->can('void', $invoice),
        ]);
    }

    public function void(VoidInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('void', $invoice);

        try {
            DB::transaction(function () use ($request, $invoice) {
                $invoice->load('items.inventoryItem');

                foreach ($invoice->items as $item) {
                    $item->inventoryItem?->update([
                        'status' => InventoryStatus::Available,
                        'sold_at' => null,
                        'warranty_expires_at' => null,
                    ]);
                }

                foreach ($invoice->tradeIns()->with('inventoryItem')->get() as $tradeIn) {
                    $tradeIn->inventoryItem?->update([
                        'status' => InventoryStatus::Returned,
                    ]);
                }

                $invoice->update([
                    'status' => InvoiceStatus::Void,
                    'voided_at' => now(),
                    'void_reason' => $request->validated('void_reason'),
                ]);
            });
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Factura anulada correctamente.');
    }

    public function pdf(Request $request, Invoice $invoice): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('view', $invoice);

        abort_unless(
            $invoice->pdf_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($invoice->pdf_path),
            404,
        );

        return \Illuminate\Support\Facades\Storage::disk('local')->download(
            $invoice->pdf_path,
            $invoice->number.'.pdf',
        );
    }
}
