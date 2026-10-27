<?php

namespace App\Services;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Layanan;
use Illuminate\Support\Facades\DB;

class ClientSyncService
{
    /**
     * Sinkronisasi perubahan dari Calon Klien ke Kontrak, Klien, dan Kelola Pekerjaan.
     */
    public static function syncFromCalonKlien(CalonKlien $calonKlien, array $data = []): void
    {
        $kontrak = $calonKlien->kontrak()->first();
        if (!$kontrak) {
            return;
        }

        $hasLayananInput = array_key_exists('layanan_ids', $data) || request()->has('layanan_ids');
        $layananIds = $data['layanan_ids'] ?? $calonKlien->layanan_ids;

        // 2. Sinkronisasi Layanan ke Kontrak (kontrak_layanan)
        if ($hasLayananInput && is_array($layananIds)) {
            $kontrak->layanan()->sync($layananIds);
        }

        // 3. Sinkronisasi rincian Kontrak (jika masih draft)
        if ($kontrak->status === 'draft') {
            if (isset($data['nilai_estimasi']) && $data['nilai_estimasi'] !== null) {
                $kontrak->nilai_proyek = $data['nilai_estimasi'];
            }
            if (isset($data['pain_points']) && !empty($data['pain_points'])) {
                $kontrak->lingkup_kerja = $data['pain_points'];
            }
            $kontrak->save();
        }

        // 4. Sinkronisasi ke Klien
        $klien = $kontrak->klien()->first();
        if ($klien) {
            $klienUpdates = [];

            if (isset($data['nama_perusahaan'])) {
                $klienUpdates['nama_perusahaan'] = $calonKlien->nama_perusahaan;
            }

            if (isset($data['alamat_perusahaan']) || isset($data['alamat'])) {
                $klienUpdates['alamat'] = $calonKlien->alamat_perusahaan ?: ($calonKlien->alamat ?: $klien->alamat);
            }

            if (isset($data['kontak_person']) || isset($data['kontak'])) {
                $klienUpdates['kontak'] = $calonKlien->kontak_person ?: ($calonKlien->kontak ?: $klien->kontak);
            }

            if ($hasLayananInput) {
                if (is_array($layananIds) && count($layananIds) > 0) {
                    $layananNames = Layanan::whereIn('id_layanan', $layananIds)->pluck('nama_layanan')->implode(', ');
                    $klienUpdates['layanan'] = $layananNames ?: '-';
                } else {
                    $klienUpdates['layanan'] = '-';
                }
            }

            if (!empty($klienUpdates)) {
                $klien->update($klienUpdates);
            }
        } elseif ($calonKlien->status_prospek === 'deal') {
            // Jika kontrak ada tapi klien belum terdaftar, buat klien
            $layananNames = $kontrak->layanan()->pluck('nama_layanan')->implode(', ') ?: 'Layanan Konsultansi & Manajemen PPSA';
            Klien::create([
                'id_kontrak' => $kontrak->id_kontrak,
                'nama_perusahaan' => $calonKlien->nama_perusahaan,
                'alamat' => $calonKlien->alamat_perusahaan ?: ($calonKlien->alamat ?: 'Alamat terlampir'),
                'kontak' => $calonKlien->kontak_person ?: ($calonKlien->kontak ?: '-'),
                'layanan' => $layananNames,
            ]);
        }
    }

    /**
     * Sinkronisasi perubahan dari Kontrak ke Calon Klien dan Klien.
     */
    public static function syncFromKontrak(Kontrak $kontrak, array $data = []): void
    {
        $hasLayananInput = array_key_exists('layanan_ids', $data) || request()->has('layanan_ids');
        $layananIds = $data['layanan_ids'] ?? ($kontrak->relationLoaded('layanan') ? $kontrak->layanan->pluck('id_layanan')->all() : $kontrak->layanan()->pluck('layanan.id_layanan')->all());

        // 1. Sinkronisasi ke Calon Klien
        $calonKlien = $kontrak->calonKlien;
        if ($calonKlien) {
            $calonUpdates = [];
            if ($hasLayananInput && is_array($layananIds)) {
                $calonUpdates['layanan_ids'] = $layananIds;
            }
            if (isset($data['nilai_proyek']) && $calonKlien->status_prospek === 'deal') {
                $calonUpdates['nilai_estimasi'] = $data['nilai_proyek'];
            }
            if (isset($data['lingkup_kerja']) && !empty($data['lingkup_kerja'])) {
                $calonUpdates['pain_points'] = $data['lingkup_kerja'];
            }
            if (!empty($calonUpdates)) {
                $calonKlien->update($calonUpdates);
            }
        }

        // 2. Sinkronisasi ke Klien
        $klien = $kontrak->klien;
        if ($klien && $hasLayananInput && is_array($layananIds)) {
            $layananNames = !empty($layananIds)
                ? Layanan::whereIn('id_layanan', $layananIds)->pluck('nama_layanan')->implode(', ')
                : '-';
            $klien->update(['layanan' => $layananNames ?: '-']);
        }
    }

    /**
     * Sinkronisasi perubahan dari Klien ke Calon Klien dan Kontrak.
     */
    public static function syncFromKlien(Klien $klien, array $data = []): void
    {
        $kontrak = $klien->kontrak;
        if (!$kontrak) {
            return;
        }

        $hasLayananInput = array_key_exists('layanan_ids', $data) || request()->has('layanan_ids');
        $layananIds = $data['layanan_ids'] ?? null;

        // 1. Sinkronisasi Layanan ke Kontrak
        if ($hasLayananInput && is_array($layananIds)) {
            $kontrak->layanan()->sync($layananIds);
        }

        // 2. Sinkronisasi ke Calon Klien
        $calonKlien = $kontrak->calonKlien;
        if ($calonKlien) {
            $calonUpdates = [];

            if (isset($data['nama_perusahaan'])) {
                $calonUpdates['nama_perusahaan'] = $klien->nama_perusahaan;
            }

            if (isset($data['alamat'])) {
                $calonUpdates['alamat_perusahaan'] = $klien->alamat;
                $calonUpdates['alamat'] = $klien->alamat;
            }

            if (isset($data['kontak'])) {
                $calonUpdates['kontak_person'] = $klien->kontak;
                $calonUpdates['kontak'] = $klien->kontak;
            }

            if ($hasLayananInput && is_array($layananIds)) {
                $calonUpdates['layanan_ids'] = $layananIds;
            }

            if (!empty($calonUpdates)) {
                $calonKlien->update($calonUpdates);
            }
        }
    }

    /**
     * Helper pembuatan Kontrak dan Klien jika Calon Klien berstatus deal.
     */
    public static function generateDefaultKontrakAndKlien(CalonKlien $calonKlien): void
    {
        DB::transaction(function () use ($calonKlien): void {
            $kontrak = $calonKlien->kontrak()->first();

            if (!$kontrak) {
                $year = date('Y');
                $existingContracts = Kontrak::where('no_kontrak', 'LIKE', "KTR-{$year}-%")->pluck('no_kontrak');
                $maxSeq = 0;
                foreach ($existingContracts as $nc) {
                    if (preg_match("/^KTR-{$year}-(\d+)$/", $nc, $m)) {
                        $seq = (int) $m[1];
                        if ($seq > $maxSeq) {
                            $maxSeq = $seq;
                        }
                    }
                }
                $nextSeq = $maxSeq + 1;
                $noKontrak = "KTR-{$year}-" . str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
                while (Kontrak::where('no_kontrak', $noKontrak)->exists()) {
                    $nextSeq++;
                    $noKontrak = "KTR-{$year}-" . str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
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

            $layananIds = $calonKlien->layanan_ids ?: request()->input('layanan_ids');
            if (is_array($layananIds) && count($layananIds) > 0) {
                $kontrak->layanan()->sync($layananIds);
            }

            if (!$kontrak->klien()->exists()) {
                $layananStr = $kontrak->layanan()->pluck('nama_layanan')->implode(', ') ?: 'Layanan Konsultansi & Manajemen PPSA';
                Klien::create([
                    'id_kontrak' => $kontrak->id_kontrak,
                    'nama_perusahaan' => $calonKlien->nama_perusahaan,
                    'alamat' => !empty($calonKlien->alamat_perusahaan) ? $calonKlien->alamat_perusahaan : 'Alamat terlampir',
                    'kontak' => !empty($calonKlien->kontak_person) ? $calonKlien->kontak_person : ($calonKlien->kontak ?: '-'),
                    'layanan' => $layananStr,
                ]);
            } elseif (is_array($layananIds) && count($layananIds) > 0) {
                $layananStr = $kontrak->layanan()->pluck('nama_layanan')->implode(', ');
                if ($layananStr) {
                    $kontrak->klien()->update(['layanan' => $layananStr]);
                }
            }
        });
    }
}
