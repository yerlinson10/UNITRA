<?php

namespace App\Services\Documents;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GotenbergClient
{
    public function __construct(
        protected ?string $baseUrl = null,
    ) {
        $this->baseUrl = rtrim($baseUrl ?? config('services.gotenberg.url'), '/');
    }

    /**
     * Convert HTML to PDF via Gotenberg Chromium endpoint.
     *
     * @throws RequestException
     */
    public function htmlToPdf(string $html, string $filename = 'document.pdf'): string
    {
        $response = Http::baseUrl($this->baseUrl)
            ->timeout(60)
            ->attach('files', $html, 'index.html')
            ->post('/forms/chromium/convert/html', [
                'printBackground' => 'true',
                'preferCssPageSize' => 'true',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                'Gotenberg PDF generation failed: '.$response->body()
            );
        }

        return $response->body();
    }

    public function url(): string
    {
        return $this->baseUrl;
    }
}
