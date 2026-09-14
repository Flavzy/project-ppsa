<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pekerjaan extends Model
{
    protected $table = 'pekerjaan';

    protected $primaryKey = 'id_pekerjaan';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_klien',
        'id_pic',
        'id_template',
        'judul',
        'deadline',
        'status',
        'tgl_selesai',
    ];

    public function klien(): BelongsTo
    {
        return $this->belongsTo(Klien::class, 'id_klien', 'id_klien');
    }

    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pic', 'id_user');
    }

    public function templateDeadline(): BelongsTo
    {
        return $this->belongsTo(TemplateDeadline::class, 'id_template', 'id_template');
    }

    public function reporting(): HasMany
    {
        return $this->hasMany(Reporting::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'tgl_selesai' => 'date',
        ];
    }
}
