<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CalonKlien extends Model
{
    use HasFactory;

    protected $table = 'calon_klien';

    protected $primaryKey = 'id_calon_klien';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_user',
        'nama_perusahaan',
        'decision_maker',
        'kontak',
        'email',
        'pain_points',
        'budget',
        'timeline',
        'lead_source',
        'prioritas',
        'nilai_estimasi',
        'catatan',
        'status_prospek',
        'tgl_followup',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function kontrak(): HasOne
    {
        return $this->hasOne(Kontrak::class, 'id_calon_klien', 'id_calon_klien');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(LeadInteraction::class, 'id_calon_klien', 'id_calon_klien');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'nilai_estimasi' => 'decimal:2',
            'tgl_followup' => 'date',
        ];
    }
}
