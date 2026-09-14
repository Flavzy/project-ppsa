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
            'nama_perusahaan' => $this->nama_perusahaan,
            'kontak' => $this->kontak,
            'status_prospek' => $this->status_prospek,
            'tgl_followup' => $this->tgl_followup?->toDateString(),
            'user' => new UserResource($this->whenLoaded('user')),
            'kontrak' => new KontrakResource($this->whenLoaded('kontrak')),
        ];
    }
}
