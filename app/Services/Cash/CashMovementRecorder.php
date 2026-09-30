<?php

namespace App\Services\Cash;

use App\Enums\CashMovementType;
use App\Enums\CashSessionStatus;
use App\Enums\PaymentMethod;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class CashMovementRecorder
{
    public function record(
        User $user,
        CashMovementType $type,
        float $amount,
        ?PaymentMethod $paymentMethod = null,
        ?Model $reference = null,
        ?string $notes = null,
        ?CashSession $session = null,
    ): CashMovement {
        if ($amount <= 0) {
            throw new InvalidArgumentException('El monto del movimiento debe ser mayor a cero.');
        }

        $storeId = $user->store_id;

        if (! $storeId) {
            throw new InvalidArgumentException('El usuario no tiene una tienda asignada.');
        }

        $session ??= CashSession::query()
            ->where('store_id', $storeId)
            ->where('status', CashSessionStatus::Open)
            ->latest('opened_at')
            ->first();

        if (! $session) {
            throw new InvalidArgumentException('No hay una sesión de caja abierta.');
        }

        return CashMovement::query()->create([
            'cash_session_id' => $session->id,
            'store_id' => $storeId,
            'user_id' => $user->id,
            'type' => $type,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->getKey(),
            'notes' => $notes,
        ]);
    }

    public function recordSale(User $user, float $amount, PaymentMethod $method, Model $invoice): CashMovement
    {
        return $this->record(
            user: $user,
            type: CashMovementType::SaleIn,
            amount: $amount,
            paymentMethod: $method,
            reference: $invoice,
            notes: 'Venta POS',
        );
    }

    public function recordPurchase(User $user, float $amount, Model $purchase, ?PaymentMethod $method = null): CashMovement
    {
        return $this->record(
            user: $user,
            type: CashMovementType::PurchaseOut,
            amount: $amount,
            paymentMethod: $method ?? PaymentMethod::Cash,
            reference: $purchase,
            notes: 'Compra de inventario',
        );
    }
}
