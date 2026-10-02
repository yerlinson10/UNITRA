<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $storeId = $request->user()->store_id;

        $users = User::query()
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value ?? $user->role,
                'is_active' => $user->is_active ?? true,
                'store_id' => $user->store_id,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Settings/Users', [
            'users' => $users,
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ]),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'store_id' => $request->user()->store_id,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $user->assignAppRole($data['role']);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UpdateUserRequest $request, User $managedUser): RedirectResponse
    {
        $this->authorize('update', $managedUser);

        $data = $request->validated();

        $managedUser->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'is_active' => $data['is_active'] ?? $managedUser->is_active,
        ]);

        if (! empty($data['password'])) {
            $managedUser->password = Hash::make($data['password']);
        }

        $managedUser->save();

        if (! empty($data['role'])) {
            $managedUser->assignAppRole($data['role']);
        }

        return back()->with('success', 'Usuario actualizado.');
    }
}
