<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KlienResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_klien' => $this->id_klien,
            'id_kontrak' => $this->id_kontrak,
            'nama_perusahaan' => $this->nama_perusahaan,
            'alamat' => $this->alamat,
            'kontak' => $this->kontak,
            'layanan' => $this->layanan,
            'kontrak' => new KontrakResource($this->whenLoaded('kontrak')),
        ];
    }
}
