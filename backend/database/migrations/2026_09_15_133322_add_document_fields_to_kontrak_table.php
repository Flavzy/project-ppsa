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
        Schema::table('kontrak', function (Blueprint $table) {
            $table->string('jenis_dokumen')->default('kontrak')->after('no_kontrak');
            $table->string('no_spk')->nullable()->after('jenis_dokumen');
            $table->decimal('nilai_proyek', 15, 2)->nullable()->after('no_spk');
            $table->text('lingkup_kerja')->nullable()->after('nilai_proyek');
            $table->string('dokumen_draft')->nullable()->after('status');
            $table->string('dokumen_final')->nullable()->after('dokumen_draft');
            $table->date('ditandatangani_pada')->nullable()->after('dokumen_final');
            $table->unsignedBigInteger('reviewed_by')->nullable()->after('ditandatangani_pada');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');

            $table->foreign('reviewed_by')
                ->references('id_user')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kontrak', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'jenis_dokumen',
                'no_spk',
                'nilai_proyek',
                'lingkup_kerja',
                'dokumen_draft',
                'dokumen_final',
                'ditandatangani_pada',
                'reviewed_by',
                'reviewed_at',
            ]);
        });
    }
};
