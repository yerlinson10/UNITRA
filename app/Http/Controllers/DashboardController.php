<?php

namespace App\Http\Controllers;

use App\Enums\CashSessionStatus;
use App\Enums\InventoryStatus;
use App\Enums\InvoiceStatus;
use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Invoice;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $storeId = $user->store_id;

        $availableUnits = InventoryItem::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InventoryStatus::Available)
            ->count();

        $soldToday = Invoice::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InvoiceStatus::Completed)
            ->whereDate('created_at', today())
            ->count();

        $salesToday = (float) Invoice::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InvoiceStatus::Completed)
            ->whereDate('created_at', today())
            ->sum('amount_due');

        $openSession = $storeId
            ? CashSession::query()
                ->where('store_id', $storeId)
                ->where('status', CashSessionStatus::Open)
                ->latest('opened_at')
                ->first()
            : null;

        $productCount = Product::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->count();

        return Inertia::render('Dashboard', [
            'availableUnits' => $availableUnits,
            'salesToday' => $salesToday,
            'cashOpen' => (bool) $openSession,
            'stats' => [
                'available_units' => $availableUnits,
                'sold_today' => $soldToday,
                'sales_today' => $salesToday,
                'product_count' => $productCount,
                'cash_session_open' => (bool) $openSession,
                'cash_opening_amount' => $openSession?->opening_amount,
            ],
        ]);
    }
}
