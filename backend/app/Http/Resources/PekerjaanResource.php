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
            'operator_pic_id' => $this->operator_pic_id,
            'judul' => $this->judul,
            'deskripsi' => $this->deskripsi,
            'lampiran_instruksi' => $this->lampiran_instruksi,
            'lampiran_instruksi_url' => $this->lampiran_instruksi_url,
            'lampiran_instruksi_urls' => $this->lampiran_instruksi_urls,
            'tgl_penugasan' => $this->tgl_penugasan?->toDateString(),
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
            'file_tugas' => $this->file_tugas,
            'file_tugas_url' => $this->file_tugas_url,
            'file_tugas_urls' => $this->file_tugas_urls,
            'catatan_karyawan' => $this->catatan_karyawan,
            'klien' => new KlienResource($this->whenLoaded('klien')),
            'pic' => new UserResource($this->whenLoaded('pic')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'performance_review' => new PerformanceReviewResource($this->whenLoaded('performanceReview')),
            'has_performance_review' => $this->relationLoaded('performanceReview')
                ? !is_null($this->performanceReview)
                : $this->performanceReview()->exists(),
            'latest_reporting' => new ReportingResource($this->whenLoaded('latestReporting')),
        ];
    }
}
