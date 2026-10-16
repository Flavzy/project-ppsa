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
            $table->string('file_tugas')->nullable()->after('catatan_review');
            $table->text('catatan_karyawan')->nullable()->after('file_tugas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->dropColumn(['file_tugas', 'catatan_karyawan']);
        });
    }
};
