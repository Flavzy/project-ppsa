<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Layanan extends Model
{
    use HasFactory;

    protected $table = 'layanan';

    protected $primaryKey = 'id_layanan';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nama_layanan',
        'kategori',
        'deskripsi',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function masterPekerjaan(): HasMany
    {
        return $this->hasMany(MasterPekerjaan::class, 'id_layanan', 'id_layanan');
    }

    public function kontrak(): BelongsToMany
    {
        return $this->belongsToMany(Kontrak::class, 'kontrak_layanan', 'id_layanan', 'id_kontrak');
    }

    public function pekerjaan(): HasMany
    {
        return $this->hasMany(Pekerjaan::class, 'id_layanan', 'id_layanan');
    }
}
