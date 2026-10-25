<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LayananResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_layanan' => $this->id_layanan,
            'nama_layanan' => $this->nama_layanan,
            'kategori' => $this->kategori,
            'deskripsi' => $this->deskripsi,
            'is_active' => (bool) $this->is_active,
            'master_pekerjaan' => MasterPekerjaanResource::collection($this->whenLoaded('masterPekerjaan')),
            'master_pekerjaan_count' => $this->master_pekerjaan_count ?? ($this->relationLoaded('masterPekerjaan') ? $this->masterPekerjaan->count() : $this->masterPekerjaan()->count()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
