<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $user->loadMissing('store');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value ?? $user->role,
                    'store_id' => $user->store_id,
                    'store' => $user->store ? [
                        'id' => $user->store->id,
                        'name' => $user->store->name,
                        'code' => $user->store->code,
                    ] : null,
                    'email_verified_at' => $user->email_verified_at,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'canViewCosts' => fn () => $user?->canViewCosts() ?? false,
            'app' => [
                'name' => config('unitra.name'),
                'currency' => config('unitra.currency'),
                'locale' => config('unitra.locale'),
            ],
        ];
    }
}
