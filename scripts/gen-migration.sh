#!/usr/bin/env bash
set -euo pipefail
cd /home/monkey/POSMobile
BASE=$(pwd)

# Migration: stores + users role
cat > database/migrations/2026_03_30_100000_create_unitra_core_tables.php <<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('cashier')->after('email');
            $table->foreignId('store_id')->nullable()->after('role')->constrained('stores')->nullOnDelete();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('brand');
            $table->string('model');
            $table->string('storage')->nullable();
            $table->string('color')->nullable();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['store_id', 'brand', 'model']);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('imei');
            $table->string('serial')->nullable();
            $table->string('condition_grade')->nullable();
            $table->unsignedTinyInteger('battery_health')->nullable();
            $table->decimal('cost', 12, 2);
            $table->decimal('min_sale_price', 12, 2)->nullable();
            $table->string('status')->default('available');
            $table->string('origin')->default('purchase');
            $table->unsignedBigInteger('purchase_item_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['store_id', 'imei']);
            $table->index(['store_id', 'status']);
        });

        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('seller_name');
            $table->string('seller_id_type');
            $table->string('seller_id_number');
            $table->string('seller_phone');
            $table->decimal('total_cost', 12, 2);
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('pdf_status')->default('pending');
            $table->timestamps();
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
            $table->string('imei');
            $table->string('serial')->nullable();
            $table->string('condition_grade')->nullable();
            $table->unsignedTinyInteger('battery_health')->nullable();
            $table->decimal('cost', 12, 2);
            $table->timestamps();
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreign('purchase_item_id')->references('id')->on('purchase_items')->nullOnDelete();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('number')->unique();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('trade_in_credit', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2);
            $table->string('payment_method');
            $table->decimal('amount_paid', 12, 2);
            $table->string('status')->default('completed');
            $table->string('ecf_status')->default('not_applicable');
            $table->string('ecf_ncf')->nullable();
            $table->json('ecf_payload')->nullable();
            $table->json('ecf_response')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('pdf_status')->default('pending');
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->restrictOnDelete();
            $table->string('product_name');
            $table->string('imei');
            $table->decimal('sale_price', 12, 2);
            $table->decimal('cost_snapshot', 12, 2);
            $table->timestamps();
        });

        Schema::create('invoice_trade_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
            $table->string('imei');
            $table->string('serial')->nullable();
            $table->string('condition_grade')->nullable();
            $table->unsignedTinyInteger('battery_health')->nullable();
            $table->decimal('credited_value', 12, 2);
            $table->string('seller_name');
            $table->string('seller_id_type');
            $table->string('seller_id_number');
            $table->string('seller_phone');
            $table->timestamps();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('opening_amount', 12, 2);
            $table->decimal('closing_amount', 12, 2)->nullable();
            $table->decimal('expected_amount', 12, 2)->nullable();
            $table->decimal('difference', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->string('payment_method')->nullable();
            $table->nullableMorphs('reference');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('invoice_trade_ins');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['purchase_item_id']);
        });
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('products');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('store_id');
            $table->dropColumn('role');
        });
        Schema::dropIfExists('stores');
    }
};
PHP

echo "Migration OK"
