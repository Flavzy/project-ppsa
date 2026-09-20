<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerformanceReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_performance_review' => $this->id_performance_review,
            'id_pekerjaan' => $this->id_pekerjaan,
            'id_user' => $this->id_user,
            'reviewed_by' => $this->reviewed_by,
            'speed_score' => $this->speed_score,
            'quality_score' => $this->quality_score,
            'revision_count' => $this->revision_count,
            'final_score' => $this->final_score,
            'catatan' => $this->catatan,
            'reviewed_at' => $this->reviewed_at?->toDateTimeString(),
            'pekerjaan' => new PekerjaanResource($this->whenLoaded('pekerjaan')),
            'user' => new UserResource($this->whenLoaded('user')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
        ];
    }
}
