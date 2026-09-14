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

class CalonKlienController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $calonKlien = CalonKlien::query()
            ->with(['user', 'kontrak'])
            ->orderByDesc('id_calon_klien')
            ->get();

        return CalonKlienResource::collection($calonKlien);
    }

    public function store(StoreCalonKlienRequest $request): JsonResponse
    {
        $calonKlien = CalonKlien::create($request->validated())
            ->load(['user', 'kontrak']);

        return (new CalonKlienResource($calonKlien))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CalonKlien $calonKlien): CalonKlienResource
    {
        return new CalonKlienResource($calonKlien->load(['user', 'kontrak']));
    }

    public function update(UpdateCalonKlienRequest $request, CalonKlien $calonKlien): CalonKlienResource
    {
        $calonKlien->update($request->validated());

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak']));
    }

    public function destroy(CalonKlien $calonKlien): Response
    {
        $calonKlien->delete();

        return response()->noContent();
    }
}
