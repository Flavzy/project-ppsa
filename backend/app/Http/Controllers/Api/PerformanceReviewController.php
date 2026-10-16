<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePerformanceReviewRequest;
use App\Http\Requests\UpdatePerformanceReviewRequest;
use App\Http\Resources\PerformanceReviewResource;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class PerformanceReviewController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', PerformanceReview::class);

        $query = PerformanceReview::query()
            ->with(['pekerjaan', 'user', 'reviewer']);

        if (request()->user()->role === 'karyawan') {
            $query->where('id_user', request()->user()->id_user);
        }

        $reviews = $query->orderByDesc('id_performance_review')->get();

        return PerformanceReviewResource::collection($reviews);
    }

    public function store(StorePerformanceReviewRequest $request): JsonResponse
    {
        Gate::authorize('create', PerformanceReview::class);

        $validated = $request->validated();
        $pekerjaan = Pekerjaan::with(['pic', 'performanceReview'])->findOrFail($validated['id_pekerjaan']);

        if (! $pekerjaan->id_pic) {
            abort(422, 'Pekerjaan ini belum memiliki PIC (Karyawan) yang ditugaskan.');
        }

        // Penilaian kinerja hanya dapat diberikan untuk pekerjaan yang telah selesai dan disetujui pimpinan
        if (!in_array($pekerjaan->status, ['completed', 'approved']) || $pekerjaan->review_status !== 'approved') {
            abort(422, 'Penilaian kinerja hanya dapat diberikan untuk pekerjaan yang telah selesai dan disetujui oleh pimpinan.');
        }

        // Pastikan pekerjaan belum pernah dinilai sebelumnya
        if ($pekerjaan->performanceReview) {
            abort(422, 'Pekerjaan ini sudah memiliki catatan evaluasi kinerja.');
        }

        $speedScore = PerformanceReview::calculateSpeedScore($pekerjaan);
        $qualityScore = (int) $validated['quality_score'];

        $review = PerformanceReview::create([
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
            'id_user' => $pekerjaan->id_pic,
            'reviewed_by' => $request->user()->id_user,
            'speed_score' => $speedScore,
            'quality_score' => $qualityScore,
            'revision_count' => $validated['revision_count'] ?? 0,
            'final_score' => PerformanceReview::calculateFinalScore($speedScore, $qualityScore),
            'catatan' => $validated['catatan'] ?? null,
            'reviewed_at' => now(),
        ])->load(['pekerjaan', 'user', 'reviewer']);

        return (new PerformanceReviewResource($review))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(PerformanceReview $performanceReview): PerformanceReviewResource
    {
        Gate::authorize('view', $performanceReview);

        return new PerformanceReviewResource($performanceReview->load(['pekerjaan', 'user', 'reviewer']));
    }

    public function update(UpdatePerformanceReviewRequest $request, PerformanceReview $performanceReview): PerformanceReviewResource
    {
        Gate::authorize('update', $performanceReview);

        $validated = $request->validated();
        $pekerjaan = isset($validated['id_pekerjaan'])
            ? Pekerjaan::findOrFail($validated['id_pekerjaan'])
            : $performanceReview->pekerjaan;

        $speedScore = PerformanceReview::calculateSpeedScore($pekerjaan);
        $qualityScore = (int) ($validated['quality_score'] ?? $performanceReview->quality_score);

        unset($validated['reviewed_by'], $validated['id_user']);

        $performanceReview->update([
            ...$validated,
            'id_user' => $pekerjaan->id_pic,
            'speed_score' => $speedScore,
            'quality_score' => $qualityScore,
            'revision_count' => $validated['revision_count'] ?? $performanceReview->revision_count,
            'final_score' => PerformanceReview::calculateFinalScore($speedScore, $qualityScore),
            'reviewed_at' => now(),
        ]);

        return new PerformanceReviewResource($performanceReview->load(['pekerjaan', 'user', 'reviewer']));
    }

    public function destroy(PerformanceReview $performanceReview): Response
    {
        Gate::authorize('delete', $performanceReview);

        $performanceReview->delete();

        return response()->noContent();
    }
}
