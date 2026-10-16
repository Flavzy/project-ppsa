<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Pekerjaan extends Model
{
    use HasFactory;

    protected $table = 'pekerjaan';

    protected $primaryKey = 'id_pekerjaan';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_klien',
        'id_pic',
        'judul',
        'deskripsi',
        'lampiran_instruksi',
        'tgl_penugasan',
        'deadline',
        'prioritas',
        'progress_persen',
        'status',
        'tgl_selesai',
        'submitted_at',
        'approved_at',
        'approved_by',
        'review_status',
        'catatan_review',
        'file_tugas',
        'catatan_karyawan',
    ];

    protected $appends = [
        'lampiran_instruksi_url',
        'lampiran_instruksi_urls',
        'file_tugas_url',
        'operator_pic_id',
    ];

    public function klien(): BelongsTo
    {
        return $this->belongsTo(Klien::class, 'id_klien', 'id_klien');
    }

    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pic', 'id_user');
    }

    public function reporting(): HasMany
    {
        return $this->hasMany(Reporting::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    public function latestReporting(): HasOne
    {
        return $this->hasOne(Reporting::class, 'id_pekerjaan', 'id_pekerjaan')->latestOfMany('id_reporting');
    }

    public function getOperatorPicIdAttribute(): ?int
    {
        return $this->klien?->kontrak?->calonKlien?->id_user ? (int) $this->klien->kontrak->calonKlien->id_user : null;
    }

    public function getLampiranInstruksiUrlsAttribute(): array
    {
        if (!$this->lampiran_instruksi) {
            return [];
        }

        if (str_starts_with($this->lampiran_instruksi, '[') && str_ends_with($this->lampiran_instruksi, ']')) {
            $decoded = json_decode($this->lampiran_instruksi, true);
            if (is_array($decoded)) {
                $result = [];
                foreach ($decoded as $item) {
                    $path = is_array($item) ? ($item['path'] ?? '') : $item;
                    $name = is_array($item) ? ($item['name'] ?? basename($path)) : basename($path);
                    if (!$path) {
                        continue;
                    }
                    $url = (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))
                        ? $path
                        : Storage::disk('public')->url($path);
                    $result[] = [
                        'name' => $name,
                        'url' => $url,
                        'path' => $path,
                    ];
                }
                return $result;
            }
        }

        $url = (str_starts_with($this->lampiran_instruksi, 'http://') || str_starts_with($this->lampiran_instruksi, 'https://'))
            ? $this->lampiran_instruksi
            : Storage::disk('public')->url($this->lampiran_instruksi);

        return [
            [
                'name' => basename($this->lampiran_instruksi),
                'url' => $url,
                'path' => $this->lampiran_instruksi,
            ]
        ];
    }

    public function getLampiranInstruksiUrlAttribute(): ?string
    {
        $urls = $this->lampiran_instruksi_urls;
        return !empty($urls) ? $urls[0]['url'] : null;
    }

    public function getFileTugasUrlsAttribute(): array
    {
        if (!$this->file_tugas) {
            return [];
        }

        if (str_starts_with($this->file_tugas, '[') && str_ends_with($this->file_tugas, ']')) {
            $decoded = json_decode($this->file_tugas, true);
            if (is_array($decoded)) {
                $result = [];
                foreach ($decoded as $item) {
                    $path = is_array($item) ? ($item['path'] ?? '') : $item;
                    $name = is_array($item) ? ($item['name'] ?? basename($path)) : basename($path);
                    if (!$path) {
                        continue;
                    }
                    $url = (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))
                        ? $path
                        : Storage::disk('public')->url($path);
                    $result[] = [
                        'name' => $name,
                        'url' => $url,
                        'path' => $path,
                    ];
                }
                return $result;
            }
        }

        $url = (str_starts_with($this->file_tugas, 'http://') || str_starts_with($this->file_tugas, 'https://'))
            ? $this->file_tugas
            : Storage::disk('public')->url($this->file_tugas);

        return [
            [
                'name' => basename($this->file_tugas),
                'url' => $url,
                'path' => $this->file_tugas,
            ]
        ];
    }

    public function getFileTugasUrlAttribute(): ?string
    {
        $urls = $this->file_tugas_urls;
        return !empty($urls) ? $urls[0]['url'] : null;
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'id_user');
    }

    public function performanceReview(): HasOne
    {
        return $this->hasOne(PerformanceReview::class, 'id_pekerjaan', 'id_pekerjaan');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tgl_penugasan' => 'date',
            'deadline' => 'date',
            'tgl_selesai' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }
}
