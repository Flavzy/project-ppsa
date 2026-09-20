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
        Schema::create('lead_interactions', function (Blueprint $table) {
            $table->id('id_interaction');
            $table->unsignedBigInteger('id_calon_klien');
            $table->unsignedBigInteger('id_user');
            $table->string('tipe_interaksi');
            $table->date('tanggal_interaksi');
            $table->text('ringkasan');
            $table->text('hasil')->nullable();
            $table->date('jadwal_followup')->nullable();
            $table->timestamps();

            $table->foreign('id_calon_klien')
                ->references('id_calon_klien')
                ->on('calon_klien')
                ->cascadeOnDelete();

            $table->foreign('id_user')
                ->references('id_user')
                ->on('users')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_interactions');
    }
};
