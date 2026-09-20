<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCalonKlienRequest;
use App\Http\Requests\UpdateCalonKlienRequest;
use App\Http\Resources\CalonKlienResource;
use App\Models\CalonKlien;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class CalonKlienController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', CalonKlien::class);

        $calonKlien = CalonKlien::query()
            ->with(['user', 'kontrak.klien', 'interactions'])
            ->orderByDesc('id_calon_klien')
            ->get();

        return CalonKlienResource::collection($calonKlien);
    }

    public function store(StoreCalonKlienRequest $request): JsonResponse
    {
        Gate::authorize('create', CalonKlien::class);

        $data = $request->validated();
        if ($request->user()->role === 'sales') {
            $data['id_user'] = $request->user()->id_user;
        }

        $calonKlien = CalonKlien::create($data)
            ->load(['user', 'kontrak']);

        return (new CalonKlienResource($calonKlien))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('view', $calonKlien);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak']));
    }

    public function update(UpdateCalonKlienRequest $request, CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('update', $calonKlien);

        $data = $request->validated();
        if ($request->user()->role === 'sales') {
            unset($data['id_user']);
        }

        $calonKlien->update($data);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak']));
    }

    public function destroy(CalonKlien $calonKlien): Response
    {
        Gate::authorize('delete', $calonKlien);

        $calonKlien->delete();

        return response()->noContent();
    }
}
