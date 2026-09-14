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

class KlienController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $klien = Klien::query()
            ->with('kontrak')
            ->orderByDesc('id_klien')
            ->get();

        return KlienResource::collection($klien);
    }

    public function store(StoreKlienRequest $request): JsonResponse
    {
        $klien = Klien::create($request->validated())
            ->load('kontrak');

        return (new KlienResource($klien))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Klien $klien): KlienResource
    {
        return new KlienResource($klien->load('kontrak'));
    }

    public function update(UpdateKlienRequest $request, Klien $klien): KlienResource
    {
        $klien->update($request->validated());

        return new KlienResource($klien->load('kontrak'));
    }

    public function destroy(Klien $klien): Response
    {
        $klien->delete();

        return response()->noContent();
    }
}
