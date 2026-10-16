<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCalonKlienRequest;
use App\Http\Requests\UpdateCalonKlienRequest;
use App\Http\Resources\CalonKlienResource;
use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Helpers\FileUploadHelper;
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
            ->with(['user', 'kontrak.klien'])
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
            $data['status_prospek'] = 'belum_deal';
        }

        // Handle file uploads
        foreach (self::FILE_FIELDS as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                if ($field === 'file_dokumen_pendukung') {
                    $files = is_array($file) ? $file : [$file];
                    $storedList = [];
                    foreach ($files as $f) {
                        if ($f instanceof \Illuminate\Http\UploadedFile) {
                            $storedList[] = [
                                'path' => FileUploadHelper::storeWithOriginalName($f, 'dokumen_legalitas', 'public'),
                                'name' => $f->getClientOriginalName(),
                            ];
                        }
                    }
                    $data[$field] = !empty($storedList) ? json_encode($storedList) : null;
                } else {
                    $data[$field] = FileUploadHelper::storeWithOriginalName($file, 'dokumen_legalitas', 'public');
                }
            }
        }

        $calonKlien = CalonKlien::create($data);
        $this->autoGenerateKontrakAndKlien($calonKlien);

        return (new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien'])))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('view', $calonKlien);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien']));
    }

    public function update(UpdateCalonKlienRequest $request, CalonKlien $calonKlien): CalonKlienResource
    {
        Gate::authorize('update', $calonKlien);

        $data = $request->validated();

        // Sync kontak and kontak_person
        if (!empty($data['kontak_person']) && empty($data['kontak'])) {
            $data['kontak'] = $data['kontak_person'];
        } elseif (!empty($data['kontak']) && empty($data['kontak_person'])) {
            $data['kontak_person'] = $data['kontak'];
        }

        // Handle file uploads (replace old file if new one is uploaded, or merge for multiple)
        foreach (self::FILE_FIELDS as $field) {
            if ($field === 'file_dokumen_pendukung') {
                $currentDocs = [];
                if ($calonKlien->file_dokumen_pendukung) {
                    if (str_starts_with($calonKlien->file_dokumen_pendukung, '[') && str_ends_with($calonKlien->file_dokumen_pendukung, ']')) {
                        $decoded = json_decode($calonKlien->file_dokumen_pendukung, true);
                        if (is_array($decoded)) {
                            foreach ($decoded as $item) {
                                $p = is_array($item) ? ($item['path'] ?? '') : $item;
                                $n = is_array($item) ? ($item['name'] ?? basename($p)) : basename($p);
                                if ($p) {
                                    $currentDocs[$p] = ['path' => $p, 'name' => $n];
                                }
                            }
                        }
                    } else {
                        $p = $calonKlien->file_dokumen_pendukung;
                        $currentDocs[$p] = ['path' => $p, 'name' => basename($p)];
                    }
                }

                $hasExistingInput = $request->has('file_dokumen_pendukung_existing_present') || $request->has('file_dokumen_pendukung_existing');
                $finalDocs = [];

                if ($hasExistingInput) {
                    $retainedInput = $request->input('file_dokumen_pendukung_existing', []);
                    $retainedArr = is_array($retainedInput) ? $retainedInput : (empty($retainedInput) ? [] : [$retainedInput]);
                    foreach ($retainedArr as $rp) {
                        if (isset($currentDocs[$rp])) {
                            $finalDocs[] = $currentDocs[$rp];
                            unset($currentDocs[$rp]);
                        }
                    }
                    // Hapus file yang tidak lagi dipertahankan
                    foreach ($currentDocs as $removed) {
                        if (Storage::disk('public')->exists($removed['path'])) {
                            Storage::disk('public')->delete($removed['path']);
                        }
                    }
                } else {
                    $finalDocs = array_values($currentDocs);
                }

                // Tambah berkas baru
                if ($request->hasFile('file_dokumen_pendukung')) {
                    $newFiles = $request->file('file_dokumen_pendukung');
                    $newFiles = is_array($newFiles) ? $newFiles : [$newFiles];
                    foreach ($newFiles as $f) {
                        if ($f instanceof \Illuminate\Http\UploadedFile) {
                            $finalDocs[] = [
                                'path' => FileUploadHelper::storeWithOriginalName($f, 'dokumen_legalitas', 'public'),
                                'name' => $f->getClientOriginalName(),
                            ];
                        }
                    }
                }

                if ($hasExistingInput || $request->hasFile('file_dokumen_pendukung')) {
                    $data['file_dokumen_pendukung'] = !empty($finalDocs) ? json_encode($finalDocs) : null;
                }
            } else {
                if ($request->hasFile($field)) {
                    if ($calonKlien->$field && Storage::disk('public')->exists($calonKlien->$field)) {
                        Storage::disk('public')->delete($calonKlien->$field);
                    }
                    $data[$field] = FileUploadHelper::storeWithOriginalName($request->file($field), 'dokumen_legalitas', 'public');
                }
            }
        }

        $calonKlien->update($data);
        $this->autoGenerateKontrakAndKlien($calonKlien);

        return new CalonKlienResource($calonKlien->load(['user', 'kontrak.klien']));
    }

    public function destroy(CalonKlien $calonKlien): Response
    {
        Gate::authorize('delete', $calonKlien);

        // Delete uploaded files from storage
        foreach (self::FILE_FIELDS as $field) {
            if ($calonKlien->$field) {
                if ($field === 'file_dokumen_pendukung' && str_starts_with($calonKlien->$field, '[') && str_ends_with($calonKlien->$field, ']')) {
                    $oldPaths = json_decode($calonKlien->$field, true);
                    if (is_array($oldPaths)) {
                        foreach ($oldPaths as $oldPath) {
                            $p = is_array($oldPath) ? ($oldPath['path'] ?? '') : $oldPath;
                            if ($p && Storage::disk('public')->exists($p)) {
                                Storage::disk('public')->delete($p);
                            }
                        }
                    }
                } elseif (Storage::disk('public')->exists($calonKlien->$field)) {
                    Storage::disk('public')->delete($calonKlien->$field);
                }
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
