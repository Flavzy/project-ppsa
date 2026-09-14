<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reporting', function (Blueprint $table) {
            $table->id('id_reporting');

            $table->unsignedBigInteger('id_pekerjaan');

            $table->date('tgl_lapor');
            $table->string('dokumen_bukti')->nullable();
            $table->text('catatan')->nullable();

            $table->foreign('id_pekerjaan')
                  ->references('id_pekerjaan')
                  ->on('pekerjaan')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reporting');
    }
};
