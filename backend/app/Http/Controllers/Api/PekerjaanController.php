<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePekerjaanRequest;
use App\Http\Requests\UpdatePekerjaanRequest;
use App\Http\Resources\PekerjaanResource;
use App\Models\Pekerjaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class PekerjaanController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Pekerjaan::class);

        $query = Pekerjaan::query()
            ->with(['klien', 'pic', 'approver', 'performanceReview']);

        if (request()->user()->role === 'karyawan') {
            $query->where('id_pic', request()->user()->id_user);
        }

        $pekerjaan = $query->orderByDesc('id_pekerjaan')->get();

        return PekerjaanResource::collection($pekerjaan);
    }

    public function store(StorePekerjaanRequest $request): JsonResponse
    {
        Gate::authorize('create', Pekerjaan::class);

        $data = $request->validated();
        if (empty($data['tgl_penugasan'])) {
            $data['tgl_penugasan'] = now()->toDateString();
        }
        $data['status'] = 'baru';
        $data['tgl_selesai'] = null;

        $pekerjaan = Pekerjaan::create($data)
            ->load(['klien', 'pic']);

        return (new PekerjaanResource($pekerjaan))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('view', $pekerjaan);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic']));
    }

    public function update(UpdatePekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('update', $pekerjaan);

        $data = $request->validated();

        if ($request->user()->role === 'karyawan') {
            if ($request->has('id_pic') && (int) $request->input('id_pic') !== (int) $pekerjaan->id_pic) {
                abort(403, 'Karyawan tidak diizinkan mengubah PIC pekerjaan.');
            }
            if ($request->has('tgl_penugasan') && $request->input('tgl_penugasan') !== $pekerjaan->tgl_penugasan?->toDateString()) {
                abort(403, 'Karyawan tidak memiliki hak untuk mengubah tanggal memasukkan tugas.');
            }
            if ($request->has('deadline') && $request->input('deadline') !== $pekerjaan->deadline?->toDateString()) {
                abort(403, 'Karyawan tidak memiliki hak untuk mengubah batas waktu (deadline).');
            }
            // Karyawan hanya boleh mengubah status pengerjaan, progress, deskripsi, catatan
            $allowed = ['status', 'progress_persen', 'deskripsi', 'catatan_review'];
            $data = array_intersect_key($data, array_flip($allowed));

            // Status yang boleh dipilih oleh karyawan untuk melapor: 'baru', 'in_progress', 'submitted'
            // Status 'completed' dan 'revision_needed' hanya wewenang persetujuan/evaluasi oleh Pimpinan
            if (isset($data['status']) && $data['status'] !== $pekerjaan->status) {
                if (in_array($data['status'], ['completed', 'revision_needed'])) {
                    abort(403, 'Status selesai dan revisi hanya dapat diberikan melalui evaluasi/persetujuan oleh Pimpinan.');
                }
                if ($data['status'] === 'submitted') {
                    $data['review_status'] = 'submitted';
                    $data['submitted_at'] = now();
                }
            }
        } else {
            // Pimpinan dan Operator tidak mengubah status pekerjaan melalui formulir manual
            // Pimpinan menyelesaikan tugas secara resmi melalui tombol persetujuan (Setujui / Approval)
            unset($data['status'], $data['tgl_selesai']);
        }

        $pekerjaan->update($data);

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic']));
    }

    public function destroy(Pekerjaan $pekerjaan): Response
    {
        Gate::authorize('delete', $pekerjaan);

        $pekerjaan->delete();

        return response()->noContent();
    }
}
