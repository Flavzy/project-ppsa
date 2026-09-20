<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportingRequest;
use App\Http\Requests\UpdateReportingRequest;
use App\Http\Resources\ReportingResource;
use App\Models\Pekerjaan;
use App\Models\Reporting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

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

        if ($request->user()->role === 'karyawan') {
            if ((int) $pekerjaan->id_pic !== (int) $request->user()->id_user) {
                abort(403, 'Anda bukan PIC untuk pekerjaan ini.');
            }
            $payload['id_user'] = $request->user()->id_user;
        } elseif (empty($payload['id_user'])) {
            $payload['id_user'] = $request->user()->id_user;
        }

        $reporting = Reporting::create($payload)
            ->load(['pekerjaan', 'user']);

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

        $payload = $this->preparePayload($request);
        if ($request->user()->role === 'karyawan') {
            unset($payload['id_user'], $payload['id_pekerjaan']);
        }

        $reporting->update($payload);

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
    private function preparePayload(StoreReportingRequest|UpdateReportingRequest $request): array
    {
        $data = $request->validated();

        if ($request->hasFile('dokumen_bukti')) {
            $data['dokumen_bukti'] = $request->file('dokumen_bukti')->store('reporting');
        }

        return $data;
    }
}
