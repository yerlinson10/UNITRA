<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
