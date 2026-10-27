<?php

namespace App\Http\Resources;

use App\Models\Layanan;
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
            'operator_pic_id' => $this->operator_pic_id,
            'nama_perusahaan' => $this->nama_perusahaan,
            'alamat' => $this->alamat,
            'kontak' => $this->kontak,
            'layanan' => $this->layanan,
            'layanan_ids' => $this->getLayananIds(),
            'kontrak' => new KontrakResource($this->whenLoaded('kontrak')),
        ];
    }

    /**
     * @return list<int>
     */
    protected function getLayananIds(): array
    {
        if ($this->relationLoaded('kontrak') && $this->kontrak) {
            if ($this->kontrak->relationLoaded('layanan') && $this->kontrak->layanan->isNotEmpty()) {
                return $this->kontrak->layanan->pluck('id_layanan')->map(fn ($id) => (int) $id)->values()->all();
            }
            if ($this->kontrak->exists) {
                $ids = $this->kontrak->layanan()->pluck('layanan.id_layanan')->map(fn ($id) => (int) $id)->values()->all();
                if (!empty($ids)) {
                    return $ids;
                }
            }
        }

        // Fallback jika string layanan ada di klien tapi relasi pivot kontrak belum terisi
        if (!empty($this->layanan)) {
            $names = array_filter(array_map('trim', explode(',', $this->layanan)));
            if (!empty($names)) {
                return Layanan::whereIn('nama_layanan', $names)
                    ->pluck('id_layanan')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all();
            }
        }

        return [];
    }
}
