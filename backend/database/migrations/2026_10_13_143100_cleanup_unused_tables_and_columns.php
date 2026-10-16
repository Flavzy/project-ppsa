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
        // 1. Drop lead_interactions table
        Schema::dropIfExists('lead_interactions');

        // 2. Drop id_template from pekerjaan and drop template_deadline table
        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->dropForeign(['id_template']);
            $table->dropColumn('id_template');
        });
        Schema::dropIfExists('template_deadline');

        // 3. Drop client-visibility columns from reporting
        Schema::table('reporting', function (Blueprint $table) {
            if (Schema::hasColumn('reporting', 'is_visible_to_client')) {
                $table->dropColumn('is_visible_to_client');
            }
            if (Schema::hasColumn('reporting', 'published_at')) {
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('reporting', 'tipe_laporan')) {
                $table->dropColumn('tipe_laporan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cleanup migration is irreversible by design
    }
};
