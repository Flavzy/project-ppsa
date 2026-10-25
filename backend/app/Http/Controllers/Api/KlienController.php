<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKlienRequest;
use App\Http\Requests\UpdateKlienRequest;
use App\Http\Resources\KlienResource;
use App\Models\Klien;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class KlienController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Klien::class);

        $klien = Klien::query()
            ->with('kontrak.calonKlien')
            ->orderByDesc('id_klien')
            ->get();

        return KlienResource::collection($klien);
    }

    public function store(StoreKlienRequest $request): JsonResponse
    {
        Gate::authorize('create', Klien::class);

        $klien = Klien::create($request->validated())
            ->load('kontrak.calonKlien');

        return (new KlienResource($klien))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Klien $klien): KlienResource
    {
        Gate::authorize('view', $klien);

        return new KlienResource($klien->load('kontrak.calonKlien'));
    }

    public function update(UpdateKlienRequest $request, Klien $klien): KlienResource
    {
        Gate::authorize('update', $klien);

        $klien->update($request->validated());

        return new KlienResource($klien->load('kontrak.calonKlien'));
    }

    public function destroy(Klien $klien): Response
    {
        Gate::authorize('delete', $klien);

        $klien->delete();

        return response()->noContent();
    }
}
