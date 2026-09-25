<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadInteractionRequest;
use App\Http\Requests\UpdateLeadInteractionRequest;
use App\Http\Resources\LeadInteractionResource;
use App\Models\CalonKlien;
use App\Models\LeadInteraction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class LeadInteractionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', LeadInteraction::class);

        $interactions = LeadInteraction::query()
            ->with(['calonKlien', 'user'])
            ->orderByDesc('tanggal_interaksi')
            ->orderByDesc('id_interaction')
            ->get();

        return LeadInteractionResource::collection($interactions);
    }

    public function store(StoreLeadInteractionRequest $request): JsonResponse
    {
        Gate::authorize('create', LeadInteraction::class);

        $validated = $request->validated();
        $calonKlien = CalonKlien::findOrFail($validated['id_calon_klien']);

        if (in_array($request->user()->role, ['operator', 'sales'], true)) {
            if ((int) $calonKlien->id_user !== (int) $request->user()->id_user) {
                abort(403, 'Akses tidak diizinkan untuk calon klien ini.');
            }
            $validated['id_user'] = $request->user()->id_user;
        }

        $interaction = LeadInteraction::create($validated)
            ->load(['calonKlien', 'user']);

        return (new LeadInteractionResource($interaction))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(LeadInteraction $leadInteraction): LeadInteractionResource
    {
        Gate::authorize('view', $leadInteraction);

        return new LeadInteractionResource($leadInteraction->load(['calonKlien', 'user']));
    }

    public function update(UpdateLeadInteractionRequest $request, LeadInteraction $leadInteraction): LeadInteractionResource
    {
        Gate::authorize('update', $leadInteraction);

        $validated = $request->validated();
        if (in_array($request->user()->role, ['operator', 'sales'], true)) {
            unset($validated['id_user'], $validated['id_calon_klien']);
        }

        $leadInteraction->update($validated);

        return new LeadInteractionResource($leadInteraction->load(['calonKlien', 'user']));
    }

    public function destroy(LeadInteraction $leadInteraction): Response
    {
        Gate::authorize('delete', $leadInteraction);

        $leadInteraction->delete();

        return response()->noContent();
    }
}
