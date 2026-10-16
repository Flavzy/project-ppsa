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
        Schema::table('reporting', function (Blueprint $table) {
            $table->text('dokumen_bukti')->nullable()->change();
        });

        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->text('file_tugas')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reporting', function (Blueprint $table) {
            $table->string('dokumen_bukti', 255)->nullable()->change();
        });

        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->string('file_tugas', 255)->nullable()->change();
        });
    }
};
