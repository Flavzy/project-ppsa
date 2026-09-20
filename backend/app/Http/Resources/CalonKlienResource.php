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
            'decision_maker' => $this->decision_maker,
            'kontak' => $this->kontak,
            'email' => $this->email,
            'pain_points' => $this->pain_points,
            'budget' => $this->budget,
            'timeline' => $this->timeline,
            'lead_source' => $this->lead_source,
            'prioritas' => $this->prioritas,
            'nilai_estimasi' => $this->nilai_estimasi,
            'catatan' => $this->catatan,
            'status_prospek' => $this->status_prospek,
            'tgl_followup' => $this->tgl_followup?->toDateString(),
            'user' => new UserResource($this->whenLoaded('user')),
            'kontrak' => new KontrakResource($this->whenLoaded('kontrak')),
            'interactions' => LeadInteractionResource::collection($this->whenLoaded('interactions')),
        ];
    }
}
