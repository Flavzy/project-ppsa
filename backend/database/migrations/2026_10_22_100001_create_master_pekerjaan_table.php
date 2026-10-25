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
        Schema::create('master_pekerjaan', function (Blueprint $table) {
            $table->id('id_master_pekerjaan');
            $table->foreignId('id_layanan')->constrained('layanan', 'id_layanan')->cascadeOnDelete();
            $table->string('nama_pekerjaan');
            $table->string('sifat_periode')->default('sekali_selesai'); // 'sekali_selesai', 'bulanan', 'tahunan'
            $table->text('template_instruksi')->nullable();
            $table->unsignedInteger('estimasi_hari')->default(7);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_pekerjaan');
    }
};
