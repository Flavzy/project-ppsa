<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConvertLeadRequest;
use App\Http\Resources\CalonKlienResource;
use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LeadConversionController extends Controller
{
    public function store(ConvertLeadRequest $request, CalonKlien $calonKlien): JsonResponse
    {
        Gate::authorize('convert', $calonKlien);

        if ($calonKlien->status_prospek !== 'deal') {
            throw ValidationException::withMessages([
                'status_prospek' => ['Calon klien harus berstatus deal sebelum dikonversi.'],
            ]);
        }

        if ($calonKlien->kontrak()->exists()) {
            throw ValidationException::withMessages([
                'id_calon_klien' => ['Calon klien ini sudah memiliki kontrak.'],
            ]);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($calonKlien, $validated): void {
            $kontrak = Kontrak::create([
                'id_calon_klien' => $calonKlien->id_calon_klien,
                'no_kontrak' => $validated['no_kontrak'],
                'jenis_dokumen' => $validated['jenis_dokumen'],
                'no_spk' => $validated['no_spk'] ?? null,
                'nilai_proyek' => $validated['nilai_proyek'] ?? $calonKlien->nilai_estimasi,
                'lingkup_kerja' => $validated['lingkup_kerja'] ?? $calonKlien->pain_points,
                'tgl_mulai' => $validated['tgl_mulai'],
                'tgl_selesai' => $validated['tgl_selesai'],
                'status' => 'draft',
            ]);

            Klien::create([
                'id_kontrak' => $kontrak->id_kontrak,
                'nama_perusahaan' => $calonKlien->nama_perusahaan,
                'alamat' => $validated['alamat'],
                'kontak' => $calonKlien->kontak,
                'layanan' => $validated['layanan'],
            ]);
        });

        return (new CalonKlienResource($calonKlien->refresh()->load(['user', 'kontrak.klien', 'interactions'])))
            ->response();
    }
}
