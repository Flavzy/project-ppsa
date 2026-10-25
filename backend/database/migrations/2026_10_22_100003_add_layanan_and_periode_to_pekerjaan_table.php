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
        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->foreignId('id_layanan')->nullable()->after('id_klien')->constrained('layanan', 'id_layanan')->nullOnDelete();
            $table->foreignId('id_master_pekerjaan')->nullable()->after('id_layanan')->constrained('master_pekerjaan', 'id_master_pekerjaan')->nullOnDelete();
            $table->string('periode_bulan', 20)->nullable()->after('tgl_penugasan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->dropForeign(['id_master_pekerjaan']);
            $table->dropForeign(['id_layanan']);
            $table->dropColumn(['id_layanan', 'id_master_pekerjaan', 'periode_bulan']);
        });
    }
};
