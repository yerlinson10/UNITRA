<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->foreign('purchase_item_id')
                ->references('id')
                ->on('purchase_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['purchase_item_id']);
        });

        Schema::dropIfExists('purchase_items');
    }
};
