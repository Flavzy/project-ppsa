<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CalonKlien extends Model
{
    protected $table = 'calon_klien';

    protected $primaryKey = 'id_calon_klien';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_user',
        'nama_perusahaan',
        'kontak',
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_followup' => 'date',
        ];
    }
}
