<?php

use App\Http\Controllers\CashSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryItemController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('products', ProductController::class)->except(['show']);

    Route::get('/inventory', [InventoryItemController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/create', [InventoryItemController::class, 'create'])->name('inventory.create');
    Route::post('/inventory', [InventoryItemController::class, 'store'])->name('inventory.store');
    Route::get('/inventory/{inventoryItem}', [InventoryItemController::class, 'show'])->name('inventory.show');
    Route::put('/inventory/{inventoryItem}', [InventoryItemController::class, 'update'])->name('inventory.update');
    Route::patch('/inventory/{inventoryItem}/status', [InventoryItemController::class, 'updateStatus'])
        ->name('inventory.status');

    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->name('purchases.show');
    Route::get('/purchases/{purchase}/pdf', [PurchaseController::class, 'pdf'])->name('purchases.pdf');

    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('/pos/lookup', [PosController::class, 'lookupImei'])->name('pos.lookup');
    Route::get('/pos/available', [PosController::class, 'available'])->name('pos.available');
    Route::post('/pos', [PosController::class, 'store'])->name('pos.store');

    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');

    Route::get('/cash', [CashSessionController::class, 'index'])->name('cash.index');
    Route::post('/cash', [CashSessionController::class, 'store'])->name('cash.store');
    Route::post('/cash/{cashSession}/close', [CashSessionController::class, 'close'])->name('cash.close');
    Route::post('/cash/{cashSession}/adjust', [CashSessionController::class, 'adjust'])->name('cash.adjust');

    Route::get('/reports', [ReportController::class, 'index'])
        ->middleware('role:admin')
        ->name('reports.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
