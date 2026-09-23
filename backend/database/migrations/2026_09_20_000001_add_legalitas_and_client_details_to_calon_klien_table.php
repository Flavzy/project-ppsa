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
        Schema::table('calon_klien', function (Blueprint $table) {
            // Profil & Kontak Klien
            $table->string('nama_klien')->nullable()->after('id_user');
            $table->text('alamat_perusahaan')->nullable()->after('nama_perusahaan');
            $table->string('nama_direktur')->nullable()->after('alamat_perusahaan');
            $table->string('kontak_person')->nullable()->after('nama_direktur');

            // Nomor Legalitas Perusahaan
            $table->string('nomor_nib')->nullable()->after('catatan');
            $table->string('nomor_npwp')->nullable()->after('nomor_nib');
            $table->string('nomor_akta_pendirian')->nullable()->after('nomor_npwp');
            $table->string('nomor_sk_kemenkumham')->nullable()->after('nomor_akta_pendirian');
            $table->string('nomor_izin_usaha')->nullable()->after('nomor_sk_kemenkumham');

            // Dokumen Pendukung Legalitas (File Paths)
            $table->string('file_nib')->nullable()->after('nomor_izin_usaha');
            $table->string('file_npwp')->nullable()->after('file_nib');
            $table->string('file_akta_pendirian')->nullable()->after('file_npwp');
            $table->string('file_sk_kemenkumham')->nullable()->after('file_akta_pendirian');
            $table->string('file_izin_usaha')->nullable()->after('file_sk_kemenkumham');
            $table->string('file_dokumen_pendukung')->nullable()->after('file_izin_usaha');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calon_klien', function (Blueprint $table) {
            $table->dropColumn([
                'nama_klien',
                'alamat_perusahaan',
                'nama_direktur',
                'kontak_person',
                'nomor_nib',
                'nomor_npwp',
                'nomor_akta_pendirian',
                'nomor_sk_kemenkumham',
                'nomor_izin_usaha',
                'file_nib',
                'file_npwp',
                'file_akta_pendirian',
                'file_sk_kemenkumham',
                'file_izin_usaha',
                'file_dokumen_pendukung',
            ]);
        });
    }
};
