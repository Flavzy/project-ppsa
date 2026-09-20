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
            'deskripsi' => $this->deskripsi,
            'deadline' => $this->deadline?->toDateString(),
            'prioritas' => $this->prioritas,
            'progress_persen' => $this->progress_persen,
            'status' => $this->status,
            'tgl_selesai' => $this->tgl_selesai?->toDateString(),
            'submitted_at' => $this->submitted_at?->toDateTimeString(),
            'approved_at' => $this->approved_at?->toDateTimeString(),
            'approved_by' => $this->approved_by,
            'review_status' => $this->review_status,
            'catatan_review' => $this->catatan_review,
            'klien' => new KlienResource($this->whenLoaded('klien')),
            'pic' => new UserResource($this->whenLoaded('pic')),
            'template_deadline' => new TemplateDeadlineResource($this->whenLoaded('templateDeadline')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'performance_review' => new PerformanceReviewResource($this->whenLoaded('performanceReview')),
        ];
    }
}
