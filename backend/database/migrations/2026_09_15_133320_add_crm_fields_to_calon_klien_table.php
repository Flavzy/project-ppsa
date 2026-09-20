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
            $table->string('decision_maker')->nullable()->after('nama_perusahaan');
            $table->string('email')->nullable()->after('kontak');
            $table->text('pain_points')->nullable()->after('email');
            $table->decimal('budget', 15, 2)->nullable()->after('pain_points');
            $table->string('timeline')->nullable()->after('budget');
            $table->string('lead_source')->nullable()->after('timeline');
            $table->string('prioritas')->default('medium')->after('lead_source');
            $table->decimal('nilai_estimasi', 15, 2)->nullable()->after('prioritas');
            $table->text('catatan')->nullable()->after('nilai_estimasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calon_klien', function (Blueprint $table) {
            $table->dropColumn([
                'decision_maker',
                'email',
                'pain_points',
                'budget',
                'timeline',
                'lead_source',
                'prioritas',
                'nilai_estimasi',
                'catatan',
            ]);
        });
    }
};
