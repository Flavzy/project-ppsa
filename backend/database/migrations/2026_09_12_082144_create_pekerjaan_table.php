<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pekerjaan', function (Blueprint $table) {
            $table->id('id_pekerjaan');

            $table->unsignedBigInteger('id_klien');
            $table->unsignedBigInteger('id_pic');
            $table->unsignedBigInteger('id_template');

            $table->string('judul');
            $table->date('deadline');
            $table->string('status');
            $table->date('tgl_selesai')->nullable();

            $table->foreign('id_klien')
                  ->references('id_klien')
                  ->on('klien')
                  ->onDelete('cascade');

            $table->foreign('id_pic')
                  ->references('id_user')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('id_template')
                  ->references('id_template')
                  ->on('template_deadline')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pekerjaan');
    }
};
