<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reporting extends Model
{
    protected $table = 'reporting';

    protected $primaryKey = 'id_reporting';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_pekerjaan',
        'tgl_lapor',
        'dokumen_bukti',
        'catatan',
    ];

    public function pekerjaan(): BelongsTo
    {
        return $this->belongsTo(Pekerjaan::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_lapor' => 'date',
        ];
    }
}
