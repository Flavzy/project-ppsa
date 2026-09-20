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
            $table->unsignedBigInteger('id_user')->nullable()->after('id_pekerjaan');
            $table->unsignedTinyInteger('progress_persen')->nullable()->after('tgl_lapor');
            $table->string('tipe_laporan')->default('internal')->after('progress_persen');
            $table->string('status_laporan')->default('draft')->after('tipe_laporan');
            $table->boolean('is_visible_to_client')->default(false)->after('status_laporan');
            $table->timestamp('published_at')->nullable()->after('is_visible_to_client');

            $table->foreign('id_user')
                ->references('id_user')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reporting', function (Blueprint $table) {
            $table->dropForeign(['id_user']);
            $table->dropColumn([
                'id_user',
                'progress_persen',
                'tipe_laporan',
                'status_laporan',
                'is_visible_to_client',
                'published_at',
            ]);
        });
    }
};
