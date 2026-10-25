<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalonKlienResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_calon_klien' => $this->id_calon_klien,
            'id_user' => $this->id_user,
            'nama_klien' => $this->nama_klien,
            'nama_perusahaan' => $this->nama_perusahaan,
            'alamat_perusahaan' => $this->alamat_perusahaan,
            'nama_direktur' => $this->nama_direktur,
            'kontak_person' => $this->kontak_person ?? $this->kontak,
            'decision_maker' => $this->decision_maker,
            'kontak' => $this->kontak ?? $this->kontak_person,
            'email' => $this->email,
            'pain_points' => $this->pain_points,
            'budget' => $this->budget,
            'timeline' => $this->timeline,
            'lead_source' => $this->lead_source,
            'prioritas' => $this->prioritas,
            'nilai_estimasi' => $this->nilai_estimasi,
            'catatan' => $this->catatan,
            'status_prospek' => $this->status_prospek,
            'tgl_followup' => $this->tgl_followup?->toDateString(),
            'layanan_ids' => (!empty($this->layanan_ids) && is_array($this->layanan_ids))
                ? array_values(array_map('intval', $this->layanan_ids))
                : ($this->relationLoaded('kontrak') && $this->kontrak && $this->kontrak->relationLoaded('layanan')
                    ? $this->kontrak->layanan->pluck('id_layanan')->values()->all()
                    : []),

            // Nomor Legalitas
            'nomor_nib' => $this->nomor_nib,
            'nomor_npwp' => $this->nomor_npwp,
            'nomor_akta_pendirian' => $this->nomor_akta_pendirian,
            'nomor_sk_kemenkumham' => $this->nomor_sk_kemenkumham,
            'nomor_izin_usaha' => $this->nomor_izin_usaha,

            // Dokumen File Paths & Public URLs
            'file_nib' => $this->file_nib,
            'file_nib_url' => $this->file_nib_url,
            'file_npwp' => $this->file_npwp,
            'file_npwp_url' => $this->file_npwp_url,
            'file_akta_pendirian' => $this->file_akta_pendirian,
            'file_akta_pendirian_url' => $this->file_akta_pendirian_url,
            'file_sk_kemenkumham' => $this->file_sk_kemenkumham,
            'file_sk_kemenkumham_url' => $this->file_sk_kemenkumham_url,
            'file_izin_usaha' => $this->file_izin_usaha,
            'file_izin_usaha_url' => $this->file_izin_usaha_url,
            'file_dokumen_pendukung' => $this->file_dokumen_pendukung,
            'file_dokumen_pendukung_url' => $this->file_dokumen_pendukung_url,
            'file_dokumen_pendukung_urls' => $this->file_dokumen_pendukung_urls,

            // Relations
            'user' => new UserResource($this->whenLoaded('user')),
            'kontrak' => new KontrakResource($this->whenLoaded('kontrak')),
        ];
    }
}
