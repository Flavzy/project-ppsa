<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKontrakRequest;
use App\Http\Requests\UpdateKontrakRequest;
use App\Http\Resources\KontrakResource;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Helpers\FileUploadHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class KontrakController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Kontrak::class);

        $kontrak = Kontrak::query()
            ->with(['calonKlien', 'klien', 'reviewer', 'layanan'])
            ->orderByDesc('id_kontrak')
            ->get();

        return KontrakResource::collection($kontrak);
    }

    public function store(StoreKontrakRequest $request): JsonResponse
    {
        Gate::authorize('create', Kontrak::class);

        $data = $this->preparePayload($request);
        $kontrak = Kontrak::create($data);

        if ($request->has('layanan_ids')) {
            $layananIds = $request->input('layanan_ids') ?: [];
            $kontrak->layanan()->sync($layananIds);

            if ($kontrak->klien) {
                $layananNames = $kontrak->layanan()->pluck('nama_layanan')->implode(', ');
                if ($layananNames) {
                    $kontrak->klien->update(['layanan' => $layananNames]);
                }
            }
        }

        $calonKlien = $kontrak->calonKlien;
        if ($calonKlien && !$kontrak->klien()->exists()) {
            $layananNames = $kontrak->layanan()->pluck('nama_layanan')->implode(', ') ?: 'Layanan Terpadu SIM-KK';
            Klien::create([
                'id_kontrak' => $kontrak->id_kontrak,
                'nama_perusahaan' => $calonKlien->nama_perusahaan,
                'alamat' => !empty($calonKlien->alamat_perusahaan) ? $calonKlien->alamat_perusahaan : 'Alamat terlampir',
                'kontak' => !empty($calonKlien->kontak_person) ? $calonKlien->kontak_person : ($calonKlien->kontak ?: '-'),
                'layanan' => $layananNames,
            ]);
        }

        $kontrak->load(['calonKlien', 'klien', 'reviewer', 'layanan']);

        return (new KontrakResource($kontrak))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Kontrak $kontrak): KontrakResource
    {
        Gate::authorize('view', $kontrak);

        return new KontrakResource($kontrak->load(['calonKlien', 'klien', 'reviewer', 'layanan']));
    }

    public function update(UpdateKontrakRequest $request, Kontrak $kontrak): KontrakResource
    {
        Gate::authorize('update', $kontrak);

        $kontrak->update($this->preparePayload($request));

        if ($request->has('layanan_ids')) {
            $layananIds = $request->input('layanan_ids') ?: [];
            $kontrak->layanan()->sync($layananIds);

            if ($kontrak->klien) {
                $layananNames = $kontrak->layanan()->pluck('nama_layanan')->implode(', ');
                if ($layananNames) {
                    $kontrak->klien->update(['layanan' => $layananNames]);
                }
            }
        }

        return new KontrakResource($kontrak->load(['calonKlien', 'klien', 'reviewer', 'layanan']));
    }

    public function destroy(Kontrak $kontrak): Response
    {
        Gate::authorize('delete', $kontrak);

        $kontrak->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function preparePayload(StoreKontrakRequest|UpdateKontrakRequest $request): array
    {
        $data = $request->validated();

        foreach (['dokumen_draft', 'dokumen_final'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = FileUploadHelper::storeWithOriginalName($request->file($field), 'kontrak', 'public');
            } else {
                unset($data[$field]);
            }
        }

        if (isset($data['reviewed_by'])) {
            $data['reviewed_at'] = now();
        }

        return $data;
    }
}
