<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StoreSettingsAndUsersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_roles_and_permissions_seeder_creates_admin_and_cashier(): void
    {
        $this->assertTrue(Role::query()->where('name', 'admin')->exists());
        $this->assertTrue(Role::query()->where('name', 'cashier')->exists());
        $this->assertTrue(Permission::query()->where('name', 'store.update')->exists());
        $this->assertTrue(Permission::query()->where('name', 'users.manage')->exists());
    }

    public function test_admin_can_update_store_settings_and_logo(): void
    {
        Storage::fake('public');

        $store = Store::factory()->create();
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $admin->assignAppRole(UserRole::Admin);

        $response = $this->actingAs($admin)->post(route('settings.store.update'), [
            'name' => 'Tienda Nueva',
            'address' => 'Calle 1',
            'phone' => '8091112222',
            'legal_name' => 'Tienda Nueva SRL',
            'rnc' => '101010101',
            'warranty_notes' => 'Solo contra defectos de fábrica.',
            'default_print_format' => 'a4',
            'logo' => UploadedFile::fake()->image('logo.png', 100, 100),
        ]);

        $response->assertRedirect();
        $store->refresh();
        $this->assertSame('Tienda Nueva', $store->name);
        $this->assertSame('a4', $store->default_print_format);
        $this->assertSame('101010101', $store->rnc);
        $this->assertNotNull($store->logo_path);
        Storage::disk('public')->assertExists($store->logo_path);
    }

    public function test_cashier_cannot_access_store_settings(): void
    {
        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $cashier->assignAppRole(UserRole::Cashier);

        $this->actingAs($cashier)
            ->get(route('settings.store.edit'))
            ->assertForbidden();
    }

    public function test_admin_can_create_cashier_user(): void
    {
        $store = Store::factory()->create();
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $admin->assignAppRole(UserRole::Admin);

        $response = $this->actingAs($admin)->post(route('settings.users.store'), [
            'name' => 'Nuevo Cajero',
            'email' => 'nuevo@unitra.local',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::Cashier->value,
        ]);

        $response->assertRedirect();
        $created = User::query()->where('email', 'nuevo@unitra.local')->first();
        $this->assertNotNull($created);
        $this->assertSame($store->id, $created->store_id);
        $this->assertTrue($created->hasAppRole('cashier'));
    }

    public function test_cashier_cannot_manage_users(): void
    {
        $store = Store::factory()->create();
        $cashier = User::factory()->create([
            'role' => UserRole::Cashier,
            'store_id' => $store->id,
            'email_verified_at' => now(),
        ]);
        $cashier->assignAppRole(UserRole::Cashier);

        $this->actingAs($cashier)
            ->get(route('settings.users.index'))
            ->assertForbidden();
    }
}
