<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterPekerjaan extends Model
{
    use HasFactory;

    protected $table = 'master_pekerjaan';

    protected $primaryKey = 'id_master_pekerjaan';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_layanan',
        'nama_pekerjaan',
        'sifat_periode',
        'template_instruksi',
        'estimasi_hari',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'estimasi_hari' => 'integer',
        ];
    }

    public function layanan(): BelongsTo
    {
        return $this->belongsTo(Layanan::class, 'id_layanan', 'id_layanan');
    }

    public function pekerjaan(): HasMany
    {
        return $this->hasMany(Pekerjaan::class, 'id_master_pekerjaan', 'id_master_pekerjaan');
    }
}
