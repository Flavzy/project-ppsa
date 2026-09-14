<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kontrak', function (Blueprint $table) {
            $table->id('id_kontrak');

            $table->unsignedBigInteger('id_calon_klien');

            $table->string('no_kontrak');
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            $table->string('status');

            $table->foreign('id_calon_klien')
                  ->references('id_calon_klien')
                  ->on('calon_klien')
                  ->onDelete('cascade');

            $table->unique('id_calon_klien');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kontrak');
    }
};
