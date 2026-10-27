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
                'status_prospek' => ['Calon klien harus berstatus deal sebelum dapat dikonversi ke kontrak.'],
            ]);
        }

        $existingKontrak = $calonKlien->kontrak()->first();
        if ($existingKontrak && $existingKontrak->status !== 'draft') {
            throw ValidationException::withMessages([
                'id_calon_klien' => ['Calon klien ini sudah memiliki kontrak aktif.'],
            ]);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($calonKlien, $validated, $existingKontrak): void {
            if ($existingKontrak) {
                $existingKontrak->update([
                    'no_kontrak' => $validated['no_kontrak'],
                    'jenis_dokumen' => $validated['jenis_dokumen'],
                    'no_spk' => $validated['no_spk'] ?? null,
                    'nilai_proyek' => $validated['nilai_proyek'] ?? $calonKlien->nilai_estimasi,
                    'lingkup_kerja' => $validated['lingkup_kerja'] ?? $calonKlien->pain_points,
                    'tgl_mulai' => $validated['tgl_mulai'],
                    'tgl_selesai' => $validated['tgl_selesai'],
                    'status' => 'aktif',
                ]);
                $kontrak = $existingKontrak;
            } else {
                $kontrak = Kontrak::create([
                    'id_calon_klien' => $calonKlien->id_calon_klien,
                    'no_kontrak' => $validated['no_kontrak'],
                    'jenis_dokumen' => $validated['jenis_dokumen'],
                    'no_spk' => $validated['no_spk'] ?? null,
                    'nilai_proyek' => $validated['nilai_proyek'] ?? $calonKlien->nilai_estimasi,
                    'lingkup_kerja' => $validated['lingkup_kerja'] ?? $calonKlien->pain_points,
                    'tgl_mulai' => $validated['tgl_mulai'],
                    'tgl_selesai' => $validated['tgl_selesai'],
                    'status' => 'aktif',
                ]);
            }

            Klien::updateOrCreate(
                ['id_kontrak' => $kontrak->id_kontrak],
                [
                    'nama_perusahaan' => $calonKlien->nama_perusahaan,
                    'alamat' => $validated['alamat'],
                    'kontak' => $calonKlien->kontak,
                    'layanan' => $validated['layanan'],
                ]
            );

            if (!empty($validated['layanan_ids']) && is_array($validated['layanan_ids'])) {
                $calonKlien->update(['layanan_ids' => $validated['layanan_ids']]);
                $kontrak->layanan()->sync($validated['layanan_ids']);
            }

            if (!empty($validated['alamat'])) {
                $calonKlien->update([
                    'alamat_perusahaan' => $validated['alamat'],
                    'alamat' => $validated['alamat'],
                ]);
            }
        });

        return (new CalonKlienResource($calonKlien->refresh()->load(['user', 'kontrak.klien'])))
            ->response();
    }
}
