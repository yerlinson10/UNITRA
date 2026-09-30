<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_trade_ins');
    }
};
