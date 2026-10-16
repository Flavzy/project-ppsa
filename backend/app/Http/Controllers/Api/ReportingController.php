<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportingRequest;
use App\Http\Requests\UpdateReportingRequest;
use App\Http\Resources\ReportingResource;
use App\Models\Pekerjaan;
use App\Models\Reporting;
use App\Helpers\FileUploadHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ReportingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Reporting::class);

        $query = Reporting::query()
            ->with(['pekerjaan', 'user']);

        if (request()->user()->role === 'karyawan') {
            $userId = request()->user()->id_user;
            $query->where(function ($q) use ($userId) {
                $q->where('id_user', $userId)
                    ->orWhereHas('pekerjaan', fn ($p) => $p->where('id_pic', $userId));
            });
        }

        $reporting = $query->orderByDesc('id_reporting')->get();

        return ReportingResource::collection($reporting);
    }

    public function store(StoreReportingRequest $request): JsonResponse
    {
        Gate::authorize('create', Reporting::class);

        $payload = $this->preparePayload($request);
        $pekerjaan = Pekerjaan::findOrFail($payload['id_pekerjaan']);

        if (in_array($pekerjaan->status, ['completed', 'approved'])) {
            abort(422, 'Pekerjaan ini telah disetujui dan berstatus selesai, tidak dapat dilaporkan kembali.');
        }

        if ($request->user()->role === 'karyawan') {
            if ((int) $pekerjaan->id_pic !== (int) $request->user()->id_user) {
                abort(403, 'Anda bukan PIC untuk pekerjaan ini.');
            }
            $payload['id_user'] = $request->user()->id_user;
        } elseif (empty($payload['id_user'])) {
            $payload['id_user'] = $request->user()->id_user;
        }

        // Pastikan status_laporan otomatis menjadi 'submitted' (Menunggu Ditinjau)
        $payload['status_laporan'] = 'submitted';

        $reporting = Reporting::create($payload)
            ->load(['pekerjaan', 'user']);

        // Sinkronisasi otomatis ke pekerjaan:
        // Saat laporan dibuat di menu Reporting, pekerjaan otomatis diajukan (submitted)
        // dan dokumen bukti serta catatan langsung terhubung ke pekerjaan untuk direview pimpinan.
        if ($pekerjaan->status !== 'completed') {
            $pekerjaanUpdate = [
                'status' => 'submitted',
                'review_status' => 'submitted',
                'submitted_at' => now(),
            ];
            if (!empty($payload['progress_persen'])) {
                $pekerjaanUpdate['progress_persen'] = $payload['progress_persen'];
            } else {
                $pekerjaanUpdate['progress_persen'] = 100;
            }
            if (!empty($payload['dokumen_bukti'])) {
                $pekerjaanUpdate['file_tugas'] = $payload['dokumen_bukti'];
            }
            if (!empty($payload['catatan'])) {
                $pekerjaanUpdate['catatan_karyawan'] = $payload['catatan'];
            }
            $pekerjaan->update($pekerjaanUpdate);
        }

        return (new ReportingResource($reporting))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Reporting $reporting): ReportingResource
    {
        Gate::authorize('view', $reporting);

        return new ReportingResource($reporting->load(['pekerjaan', 'user']));
    }

    public function update(UpdateReportingRequest $request, Reporting $reporting): ReportingResource
    {
        Gate::authorize('update', $reporting);

        // Laporan tugas yang telah disetujui / selesai tidak dapat diedit kembali
        if (in_array($reporting->status_laporan, ['approved', 'completed']) || ($reporting->pekerjaan && in_array($reporting->pekerjaan->status, ['completed', 'approved']))) {
            abort(422, 'Laporan tugas yang telah disetujui dan berstatus selesai tidak dapat diedit kembali.');
        }

        $payload = $this->preparePayload($request, $reporting);
        if ($request->user()->role === 'karyawan') {
            unset($payload['id_user'], $payload['id_pekerjaan']);
            // Saat karyawan memperbarui laporan yang sebelumnya direvisi,
            // kembalikan status_laporan ke 'submitted' (Menunggu Ditinjau)
            $payload['status_laporan'] = 'submitted';
        }

        $reporting->update($payload);

        // Sinkronisasi otomatis ke pekerjaan terkait agar statusnya kembali 'submitted'
        // sehingga tombol Setujui dan Revisi kembali muncul di pimpinan
        $pekerjaan = $reporting->pekerjaan;
        if ($pekerjaan && $pekerjaan->status !== 'completed') {
            $pekerjaanUpdate = [
                'status' => 'submitted',
                'review_status' => 'submitted',
                'submitted_at' => now(),
            ];
            if (!empty($payload['progress_persen'])) {
                $pekerjaanUpdate['progress_persen'] = $payload['progress_persen'];
            }
            if (isset($payload['dokumen_bukti'])) {
                $pekerjaanUpdate['file_tugas'] = $payload['dokumen_bukti'];
            }
            if (!empty($payload['catatan'])) {
                $pekerjaanUpdate['catatan_karyawan'] = $payload['catatan'];
            }
            $pekerjaan->update($pekerjaanUpdate);
        }

        return new ReportingResource($reporting->load(['pekerjaan', 'user']));
    }

    public function destroy(Reporting $reporting): Response
    {
        Gate::authorize('delete', $reporting);

        $reporting->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function preparePayload(StoreReportingRequest|UpdateReportingRequest $request, ?Reporting $reporting = null): array
    {
        $data = $request->validated();

        $currentDocs = [];
        if ($reporting && $reporting->dokumen_bukti) {
            if (str_starts_with($reporting->dokumen_bukti, '[') && str_ends_with($reporting->dokumen_bukti, ']')) {
                $decoded = json_decode($reporting->dokumen_bukti, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $item) {
                        $p = is_array($item) ? ($item['path'] ?? '') : $item;
                        $n = is_array($item) ? ($item['name'] ?? basename($p)) : basename($p);
                        if ($p) {
                            $currentDocs[$p] = ['path' => $p, 'name' => $n];
                        }
                    }
                }
            } else {
                $p = $reporting->dokumen_bukti;
                $currentDocs[$p] = ['path' => $p, 'name' => basename($p)];
            }
        }

        $hasExistingInput = $request->has('dokumen_bukti_existing_present') || $request->has('dokumen_bukti_existing');
        $finalDocs = [];

        if ($hasExistingInput) {
            $retainedInput = $request->input('dokumen_bukti_existing', []);
            $retainedArr = is_array($retainedInput) ? $retainedInput : (empty($retainedInput) ? [] : [$retainedInput]);
            foreach ($retainedArr as $rp) {
                if (isset($currentDocs[$rp])) {
                    $finalDocs[] = $currentDocs[$rp];
                    unset($currentDocs[$rp]);
                }
            }
            // Hapus file yang tidak lagi dipertahankan oleh pengguna
            foreach ($currentDocs as $removed) {
                if (Storage::disk('public')->exists($removed['path'])) {
                    Storage::disk('public')->delete($removed['path']);
                }
            }
        } elseif ($reporting) {
            $finalDocs = array_values($currentDocs);
        }

        // Tambah berkas baru jika diunggah
        if ($request->hasFile('dokumen_bukti')) {
            $files = $request->file('dokumen_bukti');
            $files = is_array($files) ? $files : [$files];
            foreach ($files as $f) {
                if ($f instanceof \Illuminate\Http\UploadedFile) {
                    $finalDocs[] = [
                        'path' => FileUploadHelper::storeWithOriginalName($f, 'reporting', 'public'),
                        'name' => $f->getClientOriginalName(),
                    ];
                }
            }
        }

        if ($hasExistingInput || $request->hasFile('dokumen_bukti')) {
            $data['dokumen_bukti'] = !empty($finalDocs) ? json_encode($finalDocs) : null;
        } elseif (empty($data['dokumen_bukti'])) {
            unset($data['dokumen_bukti']);
        }

        return $data;
    }
}
