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

        $items = InvoiceItem::query()
            ->select('invoice_items.*')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->where('invoices.status', InvoiceStatus::Completed)
            ->when($storeId, fn ($q) => $q->where('invoices.store_id', $storeId))
            ->whereBetween('invoices.created_at', [$from, $to])
            ->orderByDesc('invoices.created_at')
            ->limit(500)
            ->get();

        $rows = $items->map(fn (InvoiceItem $item) => [
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
                'sales' => $rows->sum('sale_price'),
                'cost' => $rows->sum('cost'),
                'margin' => $rows->sum('margin'),
            ],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }
}
