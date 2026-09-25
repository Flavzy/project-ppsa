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
        if (($data['status'] ?? '') === 'completed' && empty($data['tgl_selesai'])) {
            $data['tgl_selesai'] = now()->toDateString();
        }

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
            $allowed = ['progress_persen', 'deskripsi', 'catatan_review'];
            $data = array_intersect_key($data, array_flip($allowed));
        }

        if (($data['status'] ?? '') === 'completed' && empty($data['tgl_selesai']) && empty($pekerjaan->tgl_selesai)) {
            $data['tgl_selesai'] = now()->toDateString();
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
