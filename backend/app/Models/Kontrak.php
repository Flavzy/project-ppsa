<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Kontrak extends Model
{
    use HasFactory;

    protected $table = 'kontrak';

    protected $primaryKey = 'id_kontrak';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_calon_klien',
        'no_kontrak',
        'jenis_dokumen',
        'no_spk',
        'nilai_proyek',
        'lingkup_kerja',
        'tgl_mulai',
        'tgl_selesai',
        'status',
        'dokumen_draft',
        'dokumen_final',
        'ditandatangani_pada',
        'reviewed_by',
        'reviewed_at',
    ];

    public function calonKlien(): BelongsTo
    {
        return $this->belongsTo(CalonKlien::class, 'id_calon_klien', 'id_calon_klien');
    }

    public function klien(): HasOne
    {
        return $this->hasOne(Klien::class, 'id_kontrak', 'id_kontrak');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'id_user');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nilai_proyek' => 'decimal:2',
            'tgl_mulai' => 'date',
            'tgl_selesai' => 'date',
            'ditandatangani_pada' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }
}
