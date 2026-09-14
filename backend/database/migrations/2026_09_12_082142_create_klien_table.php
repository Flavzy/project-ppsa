<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('klien', function (Blueprint $table) {
            $table->id('id_klien');

            $table->unsignedBigInteger('id_kontrak');

            $table->string('nama_perusahaan');
            $table->text('alamat');
            $table->string('kontak');
            $table->string('layanan');

            $table->foreign('id_kontrak')
                  ->references('id_kontrak')
                  ->on('kontrak')
                  ->onDelete('cascade');

            $table->unique('id_kontrak');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('klien');
    }
};
