<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pekerjaan extends Model
{
    use HasFactory;

    protected $table = 'pekerjaan';

    protected $primaryKey = 'id_pekerjaan';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_klien',
        'id_pic',
        'id_template',
        'judul',
        'deskripsi',
        'tgl_penugasan',
        'deadline',
        'prioritas',
        'progress_persen',
        'status',
        'tgl_selesai',
        'submitted_at',
        'approved_at',
        'approved_by',
        'review_status',
        'catatan_review',
    ];

    public function klien(): BelongsTo
    {
        return $this->belongsTo(Klien::class, 'id_klien', 'id_klien');
    }

    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pic', 'id_user');
    }

    public function templateDeadline(): BelongsTo
    {
        return $this->belongsTo(TemplateDeadline::class, 'id_template', 'id_template');
    }

    public function reporting(): HasMany
    {
        return $this->hasMany(Reporting::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'id_user');
    }

    public function performanceReview(): HasOne
    {
        return $this->hasOne(PerformanceReview::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_penugasan' => 'date',
            'deadline' => 'date',
            'tgl_selesai' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }
}
