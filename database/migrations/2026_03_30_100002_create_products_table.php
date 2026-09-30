<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
