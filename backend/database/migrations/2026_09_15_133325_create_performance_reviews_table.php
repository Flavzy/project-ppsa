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
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id('id_performance_review');
            $table->unsignedBigInteger('id_pekerjaan');
            $table->unsignedBigInteger('id_user');
            $table->unsignedBigInteger('reviewed_by');
            $table->unsignedTinyInteger('speed_score');
            $table->unsignedTinyInteger('quality_score');
            $table->unsignedInteger('revision_count')->default(0);
            $table->decimal('final_score', 5, 2)->default(0);
            $table->text('catatan')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('id_pekerjaan')
                ->references('id_pekerjaan')
                ->on('pekerjaan')
                ->cascadeOnDelete();

            $table->foreign('id_user')
                ->references('id_user')
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('reviewed_by')
                ->references('id_user')
                ->on('users')
                ->cascadeOnDelete();

            $table->unique('id_pekerjaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
