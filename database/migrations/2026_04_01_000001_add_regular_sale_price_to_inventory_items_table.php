<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->decimal('regular_sale_price', 12, 2)
                ->nullable()
                ->after('min_sale_price');
        });

        DB::table('inventory_items')
            ->whereNull('regular_sale_price')
            ->whereNotNull('min_sale_price')
            ->update([
                'regular_sale_price' => DB::raw('min_sale_price'),
            ]);
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('regular_sale_price');
        });
    }
};
