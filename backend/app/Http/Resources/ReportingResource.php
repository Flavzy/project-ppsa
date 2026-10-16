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
            'status_laporan' => $this->status_laporan,
            'dokumen_bukti' => $this->dokumen_bukti,
            'dokumen_bukti_url' => $this->dokumen_bukti_url,
            'dokumen_bukti_urls' => $this->dokumen_bukti_urls,
            'catatan' => $this->catatan,
            'pekerjaan' => new PekerjaanResource($this->whenLoaded('pekerjaan')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
