<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    use HasFactory;

    protected $table = 'performance_reviews';

    protected $primaryKey = 'id_performance_review';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_pekerjaan',
        'id_user',
        'reviewed_by',
        'speed_score',
        'quality_score',
        'revision_count',
        'final_score',
        'catatan',
        'reviewed_at',
    ];

    public function pekerjaan(): BelongsTo
    {
        return $this->belongsTo(Pekerjaan::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'id_user');
    }

    public static function calculateSpeedScore(Pekerjaan $pekerjaan): int
    {
        $finishedAt = $pekerjaan->tgl_selesai ?? $pekerjaan->approved_at;

        if (! $finishedAt) {
            return 0;
        }

        if ($finishedAt->lt($pekerjaan->deadline)) {
            return 100;
        }

        if ($finishedAt->isSameDay($pekerjaan->deadline)) {
            return 85;
        }

        $daysLate = $pekerjaan->deadline->diffInDays($finishedAt);

        return max(40, 85 - ((int) $daysLate * 10));
    }

    public static function calculateFinalScore(int $speedScore, int $qualityScore): float
    {
        return round(($speedScore * 0.4) + ($qualityScore * 0.6), 2);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'final_score' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }
}
