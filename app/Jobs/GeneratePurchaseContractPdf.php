<?php

namespace App\Jobs;

use App\Models\Purchase;
use App\Services\Documents\GotenbergClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GeneratePurchaseContractPdf implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public int $purchaseId,
    ) {}

    public function handle(GotenbergClient $gotenberg): void
    {
        $purchase = Purchase::query()
            ->with(['items.product', 'store', 'user'])
            ->findOrFail($this->purchaseId);

        $html = view('pdf.purchase-contract', [
            'purchase' => $purchase,
            'brand' => config('unitra.brand'),
        ])->render();

        try {
            $pdf = $gotenberg->htmlToPdf($html, "purchase-{$purchase->id}.pdf");
        } catch (Throwable $e) {
            Log::warning('Purchase contract PDF generation failed', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        $path = "purchases/{$purchase->store_id}/contract-{$purchase->id}.pdf";
        Storage::disk('local')->put($path, $pdf);

        $purchase->update(['pdf_path' => $path]);
    }
}
