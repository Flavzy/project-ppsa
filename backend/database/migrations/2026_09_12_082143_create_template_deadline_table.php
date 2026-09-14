<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_deadline', function (Blueprint $table) {
            $table->id('id_template');

            $table->string('nama_template');
            $table->text('keterangan')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_deadline');
    }
};
