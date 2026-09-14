<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Klien extends Model
{
    protected $table = 'klien';

    protected $primaryKey = 'id_klien';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_kontrak',
        'nama_perusahaan',
        'alamat',
        'kontak',
        'layanan',
    ];

    public function kontrak(): BelongsTo
    {
        return $this->belongsTo(Kontrak::class, 'id_kontrak', 'id_kontrak');
    }

    public function pekerjaan(): HasMany
    {
        return $this->hasMany(Pekerjaan::class, 'id_klien', 'id_klien');
    }
}
