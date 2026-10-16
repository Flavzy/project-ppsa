<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewPekerjaanRequest;
use App\Http\Requests\SubmitPekerjaanRequest;
use App\Http\Resources\PekerjaanResource;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use App\Helpers\FileUploadHelper;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

class PekerjaanWorkflowController extends Controller
{
    public function start(\Illuminate\Http\Request $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('start', $pekerjaan);

        if ($pekerjaan->status !== 'baru') {
            abort(422, 'Hanya pekerjaan dengan status baru yang dapat dimulai pengerjaannya.');
        }

        $pekerjaan->update([
            'status' => 'in_progress',
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview', 'latestReporting']));
    }

    public function submit(SubmitPekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('submit', $pekerjaan);

        $fileVal = null;
        if ($request->hasFile('file_tugas')) {
            $f = $request->file('file_tugas');
            $storedPath = FileUploadHelper::storeWithOriginalName($f, 'tugas', 'public');
            $fileVal = json_encode([
                [
                    'path' => $storedPath,
                    'name' => $f->getClientOriginalName(),
                ]
            ]);
        }

        $catatan = $request->input('catatan');

        $updateData = [
            'status' => 'submitted',
            'review_status' => 'submitted',
            'progress_persen' => $request->validated('progress_persen') ?? 100,
            'submitted_at' => now(),
        ];

        if ($fileVal) {
            $updateData['file_tugas'] = $fileVal;
        }
        if ($catatan !== null) {
            $updateData['catatan_karyawan'] = $catatan;
        }

        $pekerjaan->update($updateData);

        // Otomatis catat di Reporting agar sinkron dan tidak kerja 2 kali
        Reporting::create([
            'id_pekerjaan' => $pekerjaan->id_pekerjaan,
            'id_user' => $request->user()->id_user,
            'tgl_lapor' => now()->toDateString(),
            'progress_persen' => 100,
            'status_laporan' => 'submitted',
            'dokumen_bukti' => $fileVal,
            'catatan' => $catatan ?: 'Pengajuan penyelesaian tugas dari karyawan.',
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview', 'latestReporting']));
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

        Reporting::where('id_pekerjaan', $pekerjaan->id_pekerjaan)->update([
            'status_laporan' => 'approved',
        ]);

        // Shortcut Penilaian Cepat: Simpan penilaian kinerja sekaligus jika skor kualitas diisi
        if (isset($validated['quality_score']) && $validated['quality_score'] !== null) {
            $qualityScore = (int) $validated['quality_score'];
            $speedScore = PerformanceReview::calculateSpeedScore($pekerjaan);
            $existing = PerformanceReview::where('id_pekerjaan', $pekerjaan->id_pekerjaan)->first();
            $revisionCount = $existing ? $existing->revision_count : 0;

            PerformanceReview::updateOrCreate(
                ['id_pekerjaan' => $pekerjaan->id_pekerjaan],
                [
                    'id_user' => $pekerjaan->id_pic,
                    'reviewed_by' => $request->user()->id_user,
                    'speed_score' => $speedScore,
                    'quality_score' => $qualityScore,
                    'revision_count' => $revisionCount,
                    'final_score' => PerformanceReview::calculateFinalScore($speedScore, $qualityScore),
                    'catatan' => $validated['catatan_evaluasi'] ?? ($validated['catatan_review'] ?? null),
                    'reviewed_at' => $approvedAt,
                ]
            );
        }

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview', 'latestReporting']));
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

        Reporting::where('id_pekerjaan', $pekerjaan->id_pekerjaan)->update([
            'status_laporan' => 'revision_needed',
        ]);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'approver', 'performanceReview', 'latestReporting']));
    }
}
