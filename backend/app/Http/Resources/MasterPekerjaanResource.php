<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MasterPekerjaanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_master_pekerjaan' => $this->id_master_pekerjaan,
            'id_layanan' => $this->id_layanan,
            'nama_pekerjaan' => $this->nama_pekerjaan,
            'sifat_periode' => $this->sifat_periode,
            'template_instruksi' => $this->template_instruksi,
            'estimasi_hari' => (int) $this->estimasi_hari,
            'is_active' => (bool) $this->is_active,
            'layanan' => new LayananResource($this->whenLoaded('layanan')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
