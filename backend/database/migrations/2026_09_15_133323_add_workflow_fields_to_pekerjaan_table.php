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
            $table->text('deskripsi')->nullable()->after('judul');
            $table->string('prioritas')->default('medium')->after('deadline');
            $table->unsignedTinyInteger('progress_persen')->default(0)->after('prioritas');
            $table->timestamp('submitted_at')->nullable()->after('tgl_selesai');
            $table->timestamp('approved_at')->nullable()->after('submitted_at');
            $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            $table->string('review_status')->default('pending')->after('approved_by');
            $table->text('catatan_review')->nullable()->after('review_status');

            $table->foreign('approved_by')
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
        Schema::table('pekerjaan', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'deskripsi',
                'prioritas',
                'progress_persen',
                'submitted_at',
                'approved_at',
                'approved_by',
                'review_status',
                'catatan_review',
            ]);
        });
    }
};
