<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMasterPekerjaanRequest;
use App\Http\Requests\UpdateMasterPekerjaanRequest;
use App\Http\Resources\MasterPekerjaanResource;
use App\Models\MasterPekerjaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class MasterPekerjaanController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', MasterPekerjaan::class);

        $query = MasterPekerjaan::query()->with('layanan');

        if ($request->filled('id_layanan')) {
            $query->where('id_layanan', $request->query('id_layanan'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $masterPekerjaan = $query->orderBy('id_layanan')->orderBy('id_master_pekerjaan')->get();

        return MasterPekerjaanResource::collection($masterPekerjaan);
    }

    public function store(StoreMasterPekerjaanRequest $request): JsonResponse
    {
        Gate::authorize('create', MasterPekerjaan::class);

        $master = MasterPekerjaan::create($request->validated());

        return (new MasterPekerjaanResource($master->load('layanan')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(MasterPekerjaan $masterPekerjaan): MasterPekerjaanResource
    {
        Gate::authorize('view', $masterPekerjaan);

        return new MasterPekerjaanResource($masterPekerjaan->load('layanan'));
    }

    public function update(UpdateMasterPekerjaanRequest $request, MasterPekerjaan $masterPekerjaan): MasterPekerjaanResource
    {
        Gate::authorize('update', $masterPekerjaan);

        $masterPekerjaan->update($request->validated());

        return new MasterPekerjaanResource($masterPekerjaan->load('layanan'));
    }

    public function destroy(MasterPekerjaan $masterPekerjaan): Response
    {
        Gate::authorize('delete', $masterPekerjaan);

        $masterPekerjaan->delete();

        return response()->noContent();
    }
}
