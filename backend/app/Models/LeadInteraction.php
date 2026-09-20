<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadInteraction extends Model
{
    use HasFactory;

    protected $table = 'lead_interactions';

    protected $primaryKey = 'id_interaction';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_calon_klien',
        'id_user',
        'tipe_interaksi',
        'tanggal_interaksi',
        'ringkasan',
        'hasil',
        'jadwal_followup',
    ];

    public function calonKlien(): BelongsTo
    {
        return $this->belongsTo(CalonKlien::class, 'id_calon_klien', 'id_calon_klien');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_interaksi' => 'date',
            'jadwal_followup' => 'date',
        ];
    }
}
