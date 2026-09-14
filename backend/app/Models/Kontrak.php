<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Kontrak extends Model
{
    protected $table = 'kontrak';

    protected $primaryKey = 'id_kontrak';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_calon_klien',
        'no_kontrak',
        'tgl_mulai',
        'tgl_selesai',
        'status',
    ];

    public function calonKlien(): BelongsTo
    {
        return $this->belongsTo(CalonKlien::class, 'id_calon_klien', 'id_calon_klien');
    }

    public function klien(): HasOne
    {
        return $this->hasOne(Klien::class, 'id_kontrak', 'id_kontrak');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_mulai' => 'date',
            'tgl_selesai' => 'date',
        ];
    }
}
