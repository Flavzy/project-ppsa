<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_reporting' => $this->id_reporting,
            'id_pekerjaan' => $this->id_pekerjaan,
            'id_user' => $this->id_user,
            'tgl_lapor' => $this->tgl_lapor?->toDateString(),
            'progress_persen' => $this->progress_persen,
            'tipe_laporan' => $this->tipe_laporan,
            'status_laporan' => $this->status_laporan,
            'is_visible_to_client' => $this->is_visible_to_client,
            'published_at' => $this->published_at?->toDateTimeString(),
            'dokumen_bukti' => $this->dokumen_bukti,
            'catatan' => $this->catatan,
            'pekerjaan' => new PekerjaanResource($this->whenLoaded('pekerjaan')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
