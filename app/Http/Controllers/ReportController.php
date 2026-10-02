<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canViewCosts(), 403);

        $storeId = $request->user()->store_id;
        $from = $request->date('from')?->startOfDay() ?? now()->startOfMonth();
        $to = $request->date('to')?->endOfDay() ?? now()->endOfDay();
        $search = $request->string('search')->toString();

        $filtered = function () use ($storeId, $from, $to, $search) {
            return InvoiceItem::query()
                ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
                ->where('invoices.status', InvoiceStatus::Completed)
                ->when($storeId, fn ($q) => $q->where('invoices.store_id', $storeId))
                ->whereBetween('invoices.created_at', [$from, $to])
                ->when($search !== '', function ($q) use ($search) {
                    $q->where(function ($inner) use ($search) {
                        $inner->where('invoice_items.imei', 'like', "%{$search}%")
                            ->orWhere('invoice_items.product_name', 'like', "%{$search}%");
                    });
                });
        };

        $totals = $filtered()
            ->selectRaw('COALESCE(SUM(invoice_items.sale_price), 0) as sales')
            ->selectRaw('COALESCE(SUM(invoice_items.cost_snapshot), 0) as cost')
            ->selectRaw('COALESCE(SUM(invoice_items.sale_price - invoice_items.cost_snapshot), 0) as margin')
            ->first();

        $rows = $filtered()
            ->select('invoice_items.*')
            ->orderByDesc('invoices.created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (InvoiceItem $item) => [
                'imei' => $item->imei,
                'product_label' => $item->product_name,
                'product_name' => $item->product_name,
                'sale_price' => (float) $item->sale_price,
                'cost' => (float) $item->cost_snapshot,
                'margin' => (float) $item->sale_price - (float) $item->cost_snapshot,
                'sold_at' => $item->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('Reports/Index', [
            'rows' => $rows,
            'totals' => [
                'sales' => (float) ($totals->sales ?? 0),
                'cost' => (float) ($totals->cost ?? 0),
                'margin' => (float) ($totals->margin ?? 0),
            ],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'search' => $search,
            ],
        ]);
    }
}
