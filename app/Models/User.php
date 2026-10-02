<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'role', 'store_id', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    use HasRoles {
        hasRole as spatieHasRole;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function cashSessions(): HasMany
    {
        return $this->hasMany(CashSession::class);
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin || $this->spatieHasRole('admin');
    }

    public function isCashier(): bool
    {
        return $this->role === UserRole::Cashier || $this->spatieHasRole('cashier');
    }

    public function canViewCosts(): bool
    {
        return $this->isAdmin() || $this->can('costs.view');
    }

    public function hasAppRole(UserRole|string ...$roles): bool
    {
        $values = array_map(
            fn (UserRole|string $role) => $role instanceof UserRole ? $role->value : $role,
            $roles,
        );

        if (in_array($this->role?->value, $values, true)) {
            return true;
        }

        foreach ($values as $value) {
            if ($this->spatieHasRole($value)) {
                return true;
            }
        }

        return false;
    }

    public function assignAppRole(UserRole|string $role): void
    {
        $value = $role instanceof UserRole ? $role->value : $role;

        $this->forceFill([
            'role' => $value,
        ])->save();

        $this->syncRoles([$value]);
    }
}
