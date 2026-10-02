<?php

namespace App\Services\Pos;

use App\Enums\InventoryStatus;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PosLookupService
{
    /**
     * @return array{
     *     exact: bool,
     *     item?: array<string, mixed>,
     *     results: list<array<string, mixed>>,
     *     message?: string
     * }
     */
    public function search(User $user, string $rawQuery, ?Request $request = null): array
    {
        $request ??= request();
        $query = trim($rawQuery);

        if ($query === '') {
            return [
                'exact' => false,
                'results' => [],
                'message' => 'Indica un término de búsqueda.',
            ];
        }

        $storeId = $user->store_id;
        $digits = preg_replace('/\D+/', '', $query) ?? '';

        // Scanner / exact IMEI only — never auto-pick by product name.
        if (strlen($digits) >= 14) {
            $exact = InventoryItem::query()
                ->with('product')
                ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
                ->where('status', InventoryStatus::Available)
                ->where('imei', $digits)
                ->first();

            if ($exact) {
                $resolved = (new InventoryItemResource($exact))->resolve($request);

                return [
                    'exact' => true,
                    'item' => $resolved,
                    'results' => [$resolved],
                ];
            }
        }

        $tokens = $this->tokens($query);

        if ($tokens === []) {
            return [
                'exact' => false,
                'results' => [],
                'message' => 'Sin resultados disponibles.',
            ];
        }

        $items = $this->tokenSearch($storeId, $tokens);

        if ($items->isEmpty()) {
            $items = $this->fuzzyFallback($storeId, $tokens);
        }

        if ($items->isEmpty()) {
            return [
                'exact' => false,
                'results' => [],
                'message' => 'Sin resultados disponibles.',
            ];
        }

        $results = $items
            ->map(fn (InventoryItem $item) => (new InventoryItemResource($item))->resolve($request))
            ->values()
            ->all();

        return [
            'exact' => false,
            'results' => $results,
        ];
    }

    /**
     * @return list<string>
     */
    private function tokens(string $query): array
    {
        $normalized = $this->normalize($query);

        if ($normalized === '') {
            return [];
        }

        return array_values(array_filter(
            preg_split('/\s+/', $normalized) ?: [],
            fn (string $token): bool => strlen($token) >= 2,
        ));
    }

    private function normalize(string $value): string
    {
        $value = Str::lower(Str::ascii($value));
        $value = preg_replace('/[^a-z0-9\s+]/', ' ', $value) ?? '';
        $value = preg_replace('/\s+/', ' ', $value) ?? '';

        return trim($value);
    }

    /**
     * @param  list<string>  $tokens
     * @return Collection<int, InventoryItem>
     */
    private function tokenSearch(?int $storeId, array $tokens): Collection
    {
        return InventoryItem::query()
            ->with('product')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InventoryStatus::Available)
            ->where(function ($q) use ($tokens) {
                foreach ($tokens as $token) {
                    $q->where(function ($inner) use ($token) {
                        $like = '%'.$token.'%';
                        $inner->whereRaw('LOWER(imei) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(COALESCE(serial, \'\')) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(COALESCE(condition_grade, \'\')) LIKE ?', [$like])
                            ->orWhereHas('product', function ($p) use ($like) {
                                $p->whereRaw('LOWER(name) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(brand) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(model) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(COALESCE(storage, \'\')) LIKE ?', [$like])
                                    ->orWhereRaw('LOWER(COALESCE(color, \'\')) LIKE ?', [$like]);
                            });
                    });
                }
            })
            ->orderBy('imei')
            ->limit(20)
            ->get();
    }

    /**
     * Broader candidate set scored in PHP for typos (e.g. "iphne" → "iphone").
     *
     * @param  list<string>  $tokens
     * @return Collection<int, InventoryItem>
     */
    private function fuzzyFallback(?int $storeId, array $tokens): Collection
    {
        $candidates = InventoryItem::query()
            ->with('product')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', InventoryStatus::Available)
            ->latest('id')
            ->limit(250)
            ->get();

        return $candidates
            ->filter(fn (InventoryItem $item) => $this->fuzzyMatches($item, $tokens))
            ->take(20)
            ->values();
    }

    /**
     * @param  list<string>  $tokens
     */
    private function fuzzyMatches(InventoryItem $item, array $tokens): bool
    {
        $haystack = $this->normalize(implode(' ', array_filter([
            $item->imei,
            $item->serial,
            $item->condition_grade,
            $item->product?->name,
            $item->product?->brand,
            $item->product?->model,
            $item->product?->storage,
            $item->product?->color,
        ])));

        $words = array_values(array_filter(preg_split('/\s+/', $haystack) ?: []));

        foreach ($tokens as $token) {
            if ($this->tokenMatches($token, $haystack, $words)) {
                continue;
            }

            return false;
        }

        return true;
    }

    /**
     * @param  list<string>  $words
     */
    private function tokenMatches(string $token, string $haystack, array $words): bool
    {
        if (str_contains($haystack, $token)) {
            return true;
        }

        $maxDistance = strlen($token) <= 4 ? 1 : 2;

        foreach ($words as $word) {
            if (abs(strlen($word) - strlen($token)) > $maxDistance) {
                continue;
            }

            if (levenshtein($token, $word) <= $maxDistance) {
                return true;
            }
        }

        return false;
    }
}
