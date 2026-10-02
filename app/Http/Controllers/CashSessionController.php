<?php

namespace App\Http\Controllers;

use App\Enums\CashSessionStatus;
use App\Http\Requests\Cash\CloseCashSessionRequest;
use App\Http\Requests\Cash\OpenCashSessionRequest;
use App\Models\CashSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CashSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $sessions = CashSession::query()
            ->with(['user:id,name'])
            ->withCount('movements')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('notes', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest('opened_at')
            ->paginate(20)
            ->withQueryString();

        $openSession = CashSession::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->where('status', CashSessionStatus::Open)
            ->with('movements')
            ->latest('opened_at')
            ->first();

        return Inertia::render('Cash/Index', [
            'sessions' => $sessions,
            'openSession' => $openSession,
            'expectedAmount' => $openSession?->calculateExpectedAmount(),
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'statuses' => collect(CashSessionStatus::cases())->map(fn (CashSessionStatus $case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    public function store(OpenCashSessionRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->store_id, 422, 'El usuario no tiene tienda asignada.');

        $existing = CashSession::query()
            ->where('store_id', $user->store_id)
            ->where('status', CashSessionStatus::Open)
            ->exists();

        if ($existing) {
            return back()->with('error', 'Ya existe una sesión de caja abierta.');
        }

        CashSession::query()->create([
            'store_id' => $user->store_id,
            'user_id' => $user->id,
            'opened_at' => now(),
            'opening_amount' => $request->validated('opening_amount'),
            'notes' => $request->validated('notes'),
            'status' => CashSessionStatus::Open,
        ]);

        return back()->with('success', 'Caja abierta correctamente.');
    }

    public function close(
        CloseCashSessionRequest $request,
        CashSession $cashSession,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $user->store_id === $cashSession->store_id,
            403,
        );

        if (! $cashSession->isOpen()) {
            return back()->with('error', 'La sesión de caja ya está cerrada.');
        }

        try {
            DB::transaction(function () use ($request, $cashSession) {
                $expected = $cashSession->calculateExpectedAmount();
                $closing = (float) $request->validated('closing_amount');

                $cashSession->update([
                    'closed_at' => now(),
                    'closing_amount' => $closing,
                    'expected_amount' => $expected,
                    'difference' => $closing - $expected,
                    'notes' => $request->validated('notes') ?? $cashSession->notes,
                    'status' => CashSessionStatus::Closed,
                ]);
            });
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Caja cerrada correctamente.');
    }

    public function adjust(Request $request, CashSession $cashSession): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isAdmin(), 403);
        abort_unless($user->store_id === $cashSession->store_id, 403);
        abort_unless($cashSession->isOpen(), 422);

        $data = $request->validate([
            'type' => ['required', 'in:adjustment_in,adjustment_out'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $cashSession->movements()->create([
            'store_id' => $user->store_id,
            'user_id' => $user->id,
            'type' => $data['type'],
            'amount' => $data['amount'],
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Ajuste registrado.');
    }
}
