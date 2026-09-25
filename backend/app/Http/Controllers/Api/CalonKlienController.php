<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCalonKlienRequest;
use App\Http\Requests\UpdateCalonKlienRequest;
use App\Http\Resources\CalonKlienResource;
use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class CalonKlienController extends Controller
{
    private const FILE_FIELDS = [
        'file_nib',
        'file_npwp',
        'file_akta_pendirian',
        'file_sk_kemenkumham',
        'file_izin_usaha',
        'file_dokumen_pendukung',
    ];

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

        if (empty($data['id_user'])) {
            $data['id_user'] = $request->user()->id_user;
        }

        // Sync kontak and kontak_person
        if (empty($data['kontak']) && !empty($data['kontak_person'])) {
            $data['kontak'] = $data['kontak_person'];
        } elseif (empty($data['kontak_person']) && !empty($data['kontak'])) {
            $data['kontak_person'] = $data['kontak'];
        }

        if (empty($data['status_prospek'])) {
            $data['status_prospek'] = 'prospek';
        }

        // Handle file uploads
        foreach (self::FILE_FIELDS as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = $request->file($field)->store('dokumen_legalitas', 'public');
            }
        }

        $calonKlien = CalonKlien::create($data);
        $this->autoGenerateKontrakAndKlien($calonKlien);

        return (new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien', 'interactions'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('view', $calonKlien);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien', 'interactions']));
    }

    public function update(UpdateCalonKlienRequest $request, CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('update', $calonKlien);

        $data = $request->validated();
        if (in_array($request->user()->role, ['operator', 'sales'], true)) {
            unset($data['id_user']);
        }

        // Sync kontak and kontak_person
        if (!empty($data['kontak_person']) && empty($data['kontak'])) {
            $data['kontak'] = $data['kontak_person'];
        } elseif (!empty($data['kontak']) && empty($data['kontak_person'])) {
            $data['kontak_person'] = $data['kontak'];
        }

        // Handle file uploads (replace old file if new one is uploaded)
        foreach (self::FILE_FIELDS as $field) {
            if ($request->hasFile($field)) {
                if ($calonKlien->$field && Storage::disk('public')->exists($calonKlien->$field)) {
                    Storage::disk('public')->delete($calonKlien->$field);
                }
                $data[$field] = $request->file($field)->store('dokumen_legalitas', 'public');
            }
        }

        $calonKlien->update($data);
        $this->autoGenerateKontrakAndKlien($calonKlien);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien', 'interactions']));
    }

    public function destroy(CalonKlien $calonKlien): Response
    {
        Gate::authorize('delete', $calonKlien);

        // Delete uploaded files from storage
        foreach (self::FILE_FIELDS as $field) {
            if ($calonKlien->$field && Storage::disk('public')->exists($calonKlien->$field)) {
                Storage::disk('public')->delete($calonKlien->$field);
            }
        }

        $calonKlien->delete();

        return response()->noContent();
    }

    /**
     * Otomatis generate Kontrak dan Klien jika Calon Klien berstatus deal.
     */
    private function autoGenerateKontrakAndKlien(CalonKlien $calonKlien): void
    {
        if ($calonKlien->status_prospek !== 'deal') {
            return;
        }

        DB::transaction(function () use ($calonKlien): void {
            $kontrak = $calonKlien->kontrak()->first();

            if (!$kontrak) {
                $year = date('Y');
                $month = date('m');
                $paddedId = str_pad((string) $calonKlien->id_calon_klien, 4, '0', STR_PAD_LEFT);
                $baseNo = "KTR/PPSA/{$year}/{$month}/{$paddedId}";
                $noKontrak = $baseNo;
                $counter = 1;
                while (Kontrak::where('no_kontrak', $noKontrak)->exists()) {
                    $noKontrak = "{$baseNo}-{$counter}";
                    $counter++;
                }

                $kontrak = Kontrak::create([
                    'id_calon_klien' => $calonKlien->id_calon_klien,
                    'no_kontrak' => $noKontrak,
                    'jenis_dokumen' => 'kontrak',
                    'nilai_proyek' => $calonKlien->nilai_estimasi ?? 0,
                    'lingkup_kerja' => !empty($calonKlien->pain_points)
                        ? $calonKlien->pain_points
                        : 'Penyediaan Layanan Konsultansi dan Manajemen Sistem Informasi SIM-KK PPSA',
                    'tgl_mulai' => now()->toDateString(),
                    'tgl_selesai' => now()->addYear()->toDateString(),
                    'status' => 'draft',
                ]);
            }

            if (!$kontrak->klien()->exists()) {
                Klien::create([
                    'id_kontrak' => $kontrak->id_kontrak,
                    'nama_perusahaan' => $calonKlien->nama_perusahaan,
                    'alamat' => !empty($calonKlien->alamat_perusahaan) ? $calonKlien->alamat_perusahaan : 'Alamat terlampir',
                    'kontak' => !empty($calonKlien->kontak_person) ? $calonKlien->kontak_person : ($calonKlien->kontak ?: '-'),
                    'layanan' => 'Layanan Konsultansi & Manajemen PPSA',
                ]);
            }
        });
    }
}
