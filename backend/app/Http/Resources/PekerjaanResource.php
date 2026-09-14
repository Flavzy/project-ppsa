<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PekerjaanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_pekerjaan' => $this->id_pekerjaan,
            'id_klien' => $this->id_klien,
            'id_pic' => $this->id_pic,
            'id_template' => $this->id_template,
            'judul' => $this->judul,
            'deadline' => $this->deadline?->toDateString(),
            'status' => $this->status,
            'tgl_selesai' => $this->tgl_selesai?->toDateString(),
            'klien' => new KlienResource($this->whenLoaded('klien')),
            'pic' => new UserResource($this->whenLoaded('pic')),
            'template_deadline' => new TemplateDeadlineResource($this->whenLoaded('templateDeadline')),
        ];
    }
}
