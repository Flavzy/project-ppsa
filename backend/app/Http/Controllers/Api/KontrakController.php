<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKontrakRequest;
use App\Http\Requests\UpdateKontrakRequest;
use App\Http\Resources\KontrakResource;
use App\Models\Kontrak;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class KontrakController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $kontrak = Kontrak::query()
            ->with(['calonKlien', 'klien'])
            ->orderByDesc('id_kontrak')
            ->get();

        return KontrakResource::collection($kontrak);
    }

    public function store(StoreKontrakRequest $request): JsonResponse
    {
        $kontrak = Kontrak::create($request->validated())
            ->load(['calonKlien', 'klien']);

        return (new KontrakResource($kontrak))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Kontrak $kontrak): KontrakResource
    {
        return new KontrakResource($kontrak->load(['calonKlien', 'klien']));
    }

    public function update(UpdateKontrakRequest $request, Kontrak $kontrak): KontrakResource
    {
        $kontrak->update($request->validated());

        return new KontrakResource($kontrak->load(['calonKlien', 'klien']));
    }

    public function destroy(Kontrak $kontrak): Response
    {
        $kontrak->delete();

        return response()->noContent();
    }
}
