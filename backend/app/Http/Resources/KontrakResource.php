<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KontrakResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_kontrak' => $this->id_kontrak,
            'id_calon_klien' => $this->id_calon_klien,
            'no_kontrak' => $this->no_kontrak,
            'jenis_dokumen' => $this->jenis_dokumen,
            'no_spk' => $this->no_spk,
            'nilai_proyek' => $this->nilai_proyek,
            'lingkup_kerja' => $this->lingkup_kerja,
            'tgl_mulai' => $this->tgl_mulai?->toDateString(),
            'tgl_selesai' => $this->tgl_selesai?->toDateString(),
            'status' => $this->status,
            'dokumen_draft' => $this->dokumen_draft,
            'dokumen_final' => $this->dokumen_final,
            'ditandatangani_pada' => $this->ditandatangani_pada?->toDateString(),
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toDateTimeString(),
            'calon_klien' => new CalonKlienResource($this->whenLoaded('calonKlien')),
            'klien' => new KlienResource($this->whenLoaded('klien')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
        ];
    }
}
