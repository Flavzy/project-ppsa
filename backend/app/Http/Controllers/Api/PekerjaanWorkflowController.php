<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewPekerjaanRequest;
use App\Http\Requests\SubmitPekerjaanRequest;
use App\Http\Resources\PekerjaanResource;
use App\Models\Pekerjaan;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class PekerjaanWorkflowController extends Controller
{
    public function submit(SubmitPekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('submit', $pekerjaan);

        $pekerjaan->update([
            'status' => 'submitted',
            'review_status' => 'submitted',
            'progress_persen' => $request->validated('progress_persen') ?? $pekerjaan->progress_persen,
            'submitted_at' => now(),
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview']));
    }

    public function approve(ReviewPekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('approve', $pekerjaan);

        $validated = $request->validated();
        $approvedAt = now();

        $pekerjaan->update([
            'status' => 'completed',
            'review_status' => 'approved',
            'progress_persen' => 100,
            'tgl_selesai' => Carbon::parse($approvedAt)->toDateString(),
            'approved_at' => $approvedAt,
            'approved_by' => $request->user()->id_user,
            'catatan_review' => $validated['catatan_review'] ?? null,
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview']));
    }

    public function reject(ReviewPekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('reject', $pekerjaan);

        $validated = $request->validated();

        $pekerjaan->update([
            'status' => 'revision_needed',
            'review_status' => 'revision_needed',
            'approved_by' => $request->user()->id_user,
            'catatan_review' => $validated['catatan_review'] ?? null,
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview']));
    }
}
