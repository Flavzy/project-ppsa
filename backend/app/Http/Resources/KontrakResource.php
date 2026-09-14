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
            'tgl_mulai' => $this->tgl_mulai?->toDateString(),
            'tgl_selesai' => $this->tgl_selesai?->toDateString(),
            'status' => $this->status,
            'calon_klien' => new CalonKlienResource($this->whenLoaded('calonKlien')),
            'klien' => new KlienResource($this->whenLoaded('klien')),
        ];
    }
}
