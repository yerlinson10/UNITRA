<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Services\Documents\GotenbergClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GenerateInvoicePdf implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public int $invoiceId,
    ) {}

    public function handle(GotenbergClient $gotenberg): void
    {
        $invoice = Invoice::query()
            ->with(['items.inventoryItem', 'tradeIns', 'store', 'user'])
            ->findOrFail($this->invoiceId);

        $invoice->update(['pdf_status' => 'processing']);

        $html = view('pdf.invoice', [
            'invoice' => $invoice,
            'brand' => config('unitra.brand'),
            'format' => 'a4',
        ])->render();

        try {
            $pdf = $gotenberg->htmlToPdf($html, "invoice-{$invoice->number}.pdf");
        } catch (Throwable $e) {
            $invoice->update(['pdf_status' => 'failed']);

            Log::warning('Invoice PDF generation failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        $path = "invoices/{$invoice->store_id}/{$invoice->number}.pdf";
        Storage::disk('local')->put($path, $pdf);

        $invoice->update([
            'pdf_path' => $path,
            'pdf_status' => 'ready',
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        Invoice::query()
            ->whereKey($this->invoiceId)
            ->update(['pdf_status' => 'failed']);
    }
}
