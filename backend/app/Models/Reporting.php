<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

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
        'status_laporan',
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

    public function getDokumenBuktiUrlsAttribute(): array
    {
        if (!$this->dokumen_bukti) {
            return [];
        }

        if (str_starts_with($this->dokumen_bukti, '[') && str_ends_with($this->dokumen_bukti, ']')) {
            $decoded = json_decode($this->dokumen_bukti, true);
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

        $url = (str_starts_with($this->dokumen_bukti, 'http://') || str_starts_with($this->dokumen_bukti, 'https://'))
            ? $this->dokumen_bukti
            : Storage::disk('public')->url($this->dokumen_bukti);

        return [
            [
                'name' => basename($this->dokumen_bukti),
                'url' => $url,
                'path' => $this->dokumen_bukti,
            ]
        ];
    }

    public function getDokumenBuktiUrlAttribute(): ?string
    {
        $urls = $this->dokumen_bukti_urls;
        return !empty($urls) ? $urls[0]['url'] : null;
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
