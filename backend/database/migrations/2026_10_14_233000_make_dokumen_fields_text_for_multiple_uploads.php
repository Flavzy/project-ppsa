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
            $table->text('file_dokumen_pendukung')->nullable()->change();
        });

        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->text('lampiran_instruksi')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calon_klien', function (Blueprint $table) {
            $table->string('file_dokumen_pendukung', 255)->nullable()->change();
        });

        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->string('lampiran_instruksi', 255)->nullable()->change();
        });
    }
};
