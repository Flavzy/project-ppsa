<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reporting extends Model
{
    use HasFactory;

    protected $table = 'reporting';

    protected $primaryKey = 'id_reporting';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_pekerjaan',
        'id_user',
        'tgl_lapor',
        'progress_persen',
        'tipe_laporan',
        'status_laporan',
        'is_visible_to_client',
        'published_at',
        'dokumen_bukti',
        'catatan',
    ];

    public function pekerjaan(): BelongsTo
    {
        return $this->belongsTo(Pekerjaan::class, 'id_pekerjaan', 'id_pekerjaan');
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
            'tgl_lapor' => 'date',
            'is_visible_to_client' => 'boolean',
            'published_at' => 'datetime',
        ];
    }
}
