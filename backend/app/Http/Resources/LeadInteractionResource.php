<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadInteractionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_interaction' => $this->id_interaction,
            'id_calon_klien' => $this->id_calon_klien,
            'id_user' => $this->id_user,
            'tipe_interaksi' => $this->tipe_interaksi,
            'tanggal_interaksi' => $this->tanggal_interaksi?->toDateString(),
            'ringkasan' => $this->ringkasan,
            'hasil' => $this->hasil,
            'jadwal_followup' => $this->jadwal_followup?->toDateString(),
            'calon_klien' => new CalonKlienResource($this->whenLoaded('calonKlien')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
