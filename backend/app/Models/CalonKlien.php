<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class CalonKlien extends Model
{
    use HasFactory;

    protected $table = 'calon_klien';

    protected $primaryKey = 'id_calon_klien';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::saving(function (CalonKlien $calonKlien): void {
            if (empty($calonKlien->kontak) && !empty($calonKlien->kontak_person)) {
                $calonKlien->kontak = $calonKlien->kontak_person;
            } elseif (empty($calonKlien->kontak_person) && !empty($calonKlien->kontak)) {
                $calonKlien->kontak_person = $calonKlien->kontak;
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_user',
        'nama_klien',
        'nama_perusahaan',
        'alamat_perusahaan',
        'nama_direktur',
        'kontak_person',
        'decision_maker',
        'kontak',
        'email',
        'pain_points',
        'budget',
        'timeline',
        'lead_source',
        'prioritas',
        'nilai_estimasi',
        'catatan',
        'status_prospek',
        'tgl_followup',
        'nomor_nib',
        'nomor_npwp',
        'nomor_akta_pendirian',
        'nomor_sk_kemenkumham',
        'nomor_izin_usaha',
        'file_nib',
        'file_npwp',
        'file_akta_pendirian',
        'file_sk_kemenkumham',
        'file_izin_usaha',
        'file_dokumen_pendukung',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'file_nib_url',
        'file_npwp_url',
        'file_akta_pendirian_url',
        'file_sk_kemenkumham_url',
        'file_izin_usaha_url',
        'file_dokumen_pendukung_url',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function kontrak(): HasOne
    {
        return $this->hasOne(Kontrak::class, 'id_calon_klien', 'id_calon_klien');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(LeadInteraction::class, 'id_calon_klien', 'id_calon_klien');
    }

    // Accessors for Document URLs
    public function getFileNibUrlAttribute(): ?string
    {
        return $this->file_nib ? Storage::disk('public')->url($this->file_nib) : null;
    }

    public function getFileNpwpUrlAttribute(): ?string
    {
        return $this->file_npwp ? Storage::disk('public')->url($this->file_npwp) : null;
    }

    public function getFileAktaPendirianUrlAttribute(): ?string
    {
        return $this->file_akta_pendirian ? Storage::disk('public')->url($this->file_akta_pendirian) : null;
    }

    public function getFileSkKemenkumhamUrlAttribute(): ?string
    {
        return $this->file_sk_kemenkumham ? Storage::disk('public')->url($this->file_sk_kemenkumham) : null;
    }

    public function getFileIzinUsahaUrlAttribute(): ?string
    {
        return $this->file_izin_usaha ? Storage::disk('public')->url($this->file_izin_usaha) : null;
    }

    public function getFileDokumenPendukungUrlAttribute(): ?string
    {
        return $this->file_dokumen_pendukung ? Storage::disk('public')->url($this->file_dokumen_pendukung) : null;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'nilai_estimasi' => 'decimal:2',
            'tgl_followup' => 'date',
        ];
    }
}
