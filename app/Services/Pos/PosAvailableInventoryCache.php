<?php

namespace App\Services\Pos;

use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PosAvailableInventoryCache
{
    public const PER_PAGE = 20;

    public static function versionKey(?int $storeId): string
    {
        return 'pos.available.store.'.($storeId ?? 'none').'.version';
    }

    public static function forgetStore(?int $storeId): void
    {
        $key = self::versionKey($storeId);

        if (Cache::has($key)) {
            Cache::increment($key);
        } else {
            Cache::forever($key, 2);
        }
    }

    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     meta: array{
     *         current_page: int,
     *         last_page: int,
     *         per_page: int,
     *         total: int,
     *         has_more: bool
     *     }
     * }
     */
    public function page(?int $storeId, int $page, User $user, ?Request $request = null): array
    {
        $page = max(1, $page);
        $perPage = self::PER_PAGE;
        $request ??= request();
        $version = (int) Cache::get(self::versionKey($storeId), 1);

        $cacheKey = sprintf(
            'pos.available.store.%s.v%d.page.%d.costs.%d',
            $storeId ?? 'none',
            $version,
            $page,
            $user->canViewCosts() ? 1 : 0,
        );

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($storeId, $page, $perPage, $request) {
            $paginator = InventoryItem::query()
                ->with('product')
                ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
                ->available()
                ->latest('id')
                ->paginate(perPage: $perPage, page: $page);

            $data = $paginator->getCollection()
                ->map(fn (InventoryItem $item) => (new InventoryItemResource($item))->resolve($request))
                ->values()
                ->all();

            return [
                'data' => $data,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'has_more' => $paginator->hasMorePages(),
                ],
            ];
        });
    }
}
