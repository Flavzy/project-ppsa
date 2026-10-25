<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kontrak_layanan', function (Blueprint $table) {
            $table->foreignId('id_kontrak')->constrained('kontrak', 'id_kontrak')->cascadeOnDelete();
            $table->foreignId('id_layanan')->constrained('layanan', 'id_layanan')->cascadeOnDelete();
            $table->primary(['id_kontrak', 'id_layanan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kontrak_layanan');
    }
};
