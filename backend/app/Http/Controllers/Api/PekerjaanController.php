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

class PekerjaanController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $pekerjaan = Pekerjaan::query()
            ->with(['klien', 'pic', 'templateDeadline'])
            ->orderByDesc('id_pekerjaan')
            ->get();

        return PekerjaanResource::collection($pekerjaan);
    }

    public function store(StorePekerjaanRequest $request): JsonResponse
    {
        $pekerjaan = Pekerjaan::create($request->validated())
            ->load(['klien', 'pic', 'templateDeadline']);

        return (new PekerjaanResource($pekerjaan))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Pekerjaan $pekerjaan): PekerjaanResource
    {
        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'templateDeadline']));
    }

    public function update(UpdatePekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        $pekerjaan->update($request->validated());

        return new PekerjaanResource($pekerjaan->load(['klien', 'pic', 'templateDeadline']));
    }

    public function destroy(Pekerjaan $pekerjaan): Response
    {
        $pekerjaan->delete();

        return response()->noContent();
    }
}
