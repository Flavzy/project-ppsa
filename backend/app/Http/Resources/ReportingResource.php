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
            'tgl_lapor' => $this->tgl_lapor?->toDateString(),
            'dokumen_bukti' => $this->dokumen_bukti,
            'catatan' => $this->catatan,
            'pekerjaan' => new PekerjaanResource($this->whenLoaded('pekerjaan')),
        ];
    }
}
