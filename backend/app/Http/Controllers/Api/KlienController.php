<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKlienRequest;
use App\Http\Requests\UpdateKlienRequest;
use App\Http\Resources\KlienResource;
use App\Models\Klien;
use App\Models\Layanan;
use App\Services\ClientSyncService;
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
            ->with(['kontrak.calonKlien', 'kontrak.layanan'])
            ->orderByDesc('id_klien')
            ->get();

        return KlienResource::collection($klien);
    }

    public function store(StoreKlienRequest $request): JsonResponse
    {
        Gate::authorize('create', Klien::class);

        $validated = $request->validated();
        $layananIds = $request->input('layanan_ids');

        if (is_array($layananIds) && count($layananIds) > 0) {
            $layananNames = Layanan::whereIn('id_layanan', $layananIds)->pluck('nama_layanan')->implode(', ');
            $validated['layanan'] = $layananNames ?: '-';
        } elseif (empty($validated['layanan'])) {
            $validated['layanan'] = '-';
        }

        unset($validated['layanan_ids']);

        $klien = Klien::create($validated);

        if (is_array($layananIds) && $klien->kontrak) {
            $klien->kontrak->layanan()->sync($layananIds);
        }

        ClientSyncService::syncFromKlien($klien, $request->validated());

        return (new KlienResource($klien->load(['kontrak.calonKlien', 'kontrak.layanan'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Klien $klien): KlienResource
    {
        Gate::authorize('view', $klien);

        return new KlienResource($klien->load(['kontrak.calonKlien', 'kontrak.layanan']));
    }

    public function update(UpdateKlienRequest $request, Klien $klien): KlienResource
    {
        Gate::authorize('update', $klien);

        $validated = $request->validated();

        if ($request->has('layanan_ids')) {
            $layananIds = $request->input('layanan_ids') ?: [];
            if (is_array($layananIds)) {
                if (count($layananIds) > 0) {
                    $layananNames = Layanan::whereIn('id_layanan', $layananIds)->pluck('nama_layanan')->implode(', ');
                    $validated['layanan'] = $layananNames ?: '-';
                } else {
                    $validated['layanan'] = '-';
                }
            }
        }

        unset($validated['layanan_ids']);

        $klien->update($validated);

        if ($request->has('layanan_ids')) {
            $layananIds = $request->input('layanan_ids') ?: [];
            $klien->refresh();
            if (is_array($layananIds) && $klien->kontrak) {
                $klien->kontrak->layanan()->sync($layananIds);
            }
        }

        ClientSyncService::syncFromKlien($klien, $request->validated());

        return new KlienResource($klien->load(['kontrak.calonKlien', 'kontrak.layanan']));
    }

    public function destroy(Klien $klien): Response
    {
        Gate::authorize('delete', $klien);

        $klien->delete();

        return response()->noContent();
    }
}
