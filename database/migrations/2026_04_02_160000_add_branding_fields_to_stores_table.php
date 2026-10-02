<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('phone');
            $table->string('legal_name')->nullable()->after('logo_path');
            $table->string('rnc', 32)->nullable()->after('legal_name');
            $table->text('warranty_notes')->nullable()->after('rnc');
            $table->string('default_print_format', 8)->default('80mm')->after('warranty_notes');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'logo_path',
                'legal_name',
                'rnc',
                'warranty_notes',
                'default_print_format',
            ]);
        });
    }
};
