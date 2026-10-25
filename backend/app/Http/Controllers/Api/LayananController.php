<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLayananRequest;
use App\Http\Requests\UpdateLayananRequest;
use App\Http\Resources\LayananResource;
use App\Models\Layanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class LayananController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Layanan::class);

        $query = Layanan::query()
            ->with(['masterPekerjaan'])
            ->withCount('masterPekerjaan');

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $layanan = $query->orderBy('id_layanan')->get();

        return LayananResource::collection($layanan);
    }

    public function store(StoreLayananRequest $request): JsonResponse
    {
        Gate::authorize('create', Layanan::class);

        $layanan = Layanan::create($request->validated());

        return (new LayananResource($layanan->load('masterPekerjaan')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Layanan $layanan): LayananResource
    {
        Gate::authorize('view', $layanan);

        return new LayananResource($layanan->load('masterPekerjaan'));
    }

    public function update(UpdateLayananRequest $request, Layanan $layanan): LayananResource
    {
        Gate::authorize('update', $layanan);

        $layanan->update($request->validated());

        return new LayananResource($layanan->load('masterPekerjaan'));
    }

    public function destroy(Layanan $layanan): Response
    {
        Gate::authorize('delete', $layanan);

        $layanan->delete();

        return response()->noContent();
    }
}
