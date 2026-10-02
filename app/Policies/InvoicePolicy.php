<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->store_id === $invoice->store_id || $user->isAdmin();
    }

    public function void(User $user, Invoice $invoice): bool
    {
        if ($invoice->isVoid()) {
            return false;
        }

        return $user->can('invoices.void') || $user->isAdmin();
    }

    public function viewCost(User $user, ?Invoice $invoice = null): bool
    {
        return $user->canViewCosts();
    }
}
