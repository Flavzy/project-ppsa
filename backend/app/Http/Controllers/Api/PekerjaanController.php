<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePekerjaanRequest;
use App\Http\Requests\UpdatePekerjaanRequest;
use App\Http\Resources\PekerjaanResource;
use App\Models\Pekerjaan;
use App\Models\Reporting;
use App\Helpers\FileUploadHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PekerjaanController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Pekerjaan::class);

        $query = Pekerjaan::query()
            ->with(['klien.kontrak.calonKlien', 'klien.kontrak.layanan', 'pic', 'approver', 'performanceReview', 'latestReporting', 'layanan', 'masterPekerjaan']);

        if (request()->user()->role === 'karyawan') {
            $query->where('id_pic', request()->user()->id_user);
        }

        $pekerjaan = $query->orderByDesc('id_pekerjaan')->get();

        return PekerjaanResource::collection($pekerjaan);
    }

    public function store(StorePekerjaanRequest $request): JsonResponse
    {
        Gate::authorize('create', Pekerjaan::class);

        $data = $request->validated();
        if (empty($data['tgl_penugasan'])) {
            $data['tgl_penugasan'] = now()->toDateString();
        }
        $data['status'] = 'baru';
        $data['tgl_selesai'] = null;

        if ($request->hasFile('lampiran_instruksi')) {
            $file = $request->file('lampiran_instruksi');
            $files = is_array($file) ? $file : [$file];
            $storedList = [];
            foreach ($files as $f) {
                if ($f instanceof \Illuminate\Http\UploadedFile) {
                    $storedList[] = [
                        'path' => FileUploadHelper::storeWithOriginalName($f, 'panduan_tugas', 'public'),
                        'name' => $f->getClientOriginalName(),
                    ];
                }
            }
            $data['lampiran_instruksi'] = !empty($storedList) ? json_encode($storedList) : null;
        } elseif (empty($data['lampiran_instruksi'])) {
            unset($data['lampiran_instruksi']);
        }

        $pekerjaan = Pekerjaan::create($data)
            ->load(['klien.kontrak.calonKlien', 'klien.kontrak.layanan', 'pic', 'latestReporting', 'layanan', 'masterPekerjaan']);

        return (new PekerjaanResource($pekerjaan))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function batchStore(Request $request): JsonResponse
    {
        Gate::authorize('create', Pekerjaan::class);

        $validated = $request->validate([
            'id_klien' => [
                'required',
                'integer',
                'exists:klien,id_klien',
                function ($attribute, $value, $fail) {
                    $klien = \App\Models\Klien::with('kontrak')->find($value);
                    if (!$klien || !$klien->kontrak || $klien->kontrak->status !== 'aktif') {
                        $fail('Pekerjaan tidak dapat ditambahkan karena kontrak klien sedang nonaktif atau telah dibatalkan.');
                    }
                },
            ],
            'id_layanan' => ['nullable', 'integer', 'exists:layanan,id_layanan'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.judul' => ['required', 'string', 'max:255'],
            'items.*.id_pic' => [
                'required',
                'integer',
                Rule::exists('users', 'id_user')->where(fn ($query) => $query->where('role', 'karyawan')),
            ],
            'items.*.deadline' => ['required', 'date', 'after_or_equal:today'],
            'items.*.id_master_pekerjaan' => ['nullable', 'integer', 'exists:master_pekerjaan,id_master_pekerjaan'],
            'items.*.deskripsi' => ['nullable', 'string'],
            'items.*.periode_bulan' => [
                'nullable',
                'string',
                'max:20',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && $value < now()->format('Y-m')) {
                        $fail('Bulan pengerjaan tidak boleh sebelum bulan ini.');
                    }
                },
            ],
            'items.*.prioritas' => ['nullable', 'string', 'max:255'],
            'items.*.lampiran_instruksi' => ['nullable'],
            'items.*.lampiran_instruksi.*' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value instanceof \Illuminate\Http\UploadedFile) {
                        if ($value->getSize() > 20480 * 1024) {
                            $fail("Ukuran file {$value->getClientOriginalName()} melebihi batas 20MB.");
                        }
                        $allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, $allowedExts, true)) {
                            $fail("Format file {$value->getClientOriginalName()} ({$ext}) tidak didukung.");
                        }
                    }
                },
            ],
        ], [
            'items.*.id_pic.exists' => 'Penanggung jawab (PIC) harus merupakan pengguna dengan peran Karyawan.',
            'items.*.deadline.after_or_equal' => 'Batas waktu (deadline) tidak boleh sebelum hari ini.',
        ]);

        $createdPekerjaan = DB::transaction(function () use ($validated, $request) {
            $created = [];
            $today = now()->toDateString();

            foreach ($validated['items'] as $index => $item) {
                $lampiranInstruksi = null;
                $fileInput = $request->file("items.{$index}.lampiran_instruksi")
                    ?? $request->file("lampiran_instruksi_{$index}")
                    ?? null;

                if ($fileInput) {
                    $files = is_array($fileInput) ? $fileInput : [$fileInput];
                    $storedList = [];
                    foreach ($files as $f) {
                        if ($f instanceof \Illuminate\Http\UploadedFile) {
                            $storedList[] = [
                                'path' => FileUploadHelper::storeWithOriginalName($f, 'panduan_tugas', 'public'),
                                'name' => $f->getClientOriginalName(),
                            ];
                        }
                    }
                    $lampiranInstruksi = !empty($storedList) ? json_encode($storedList) : null;
                }

                $pekerjaan = Pekerjaan::create([
                    'id_klien' => $validated['id_klien'],
                    'id_layanan' => $validated['id_layanan'] ?? null,
                    'id_master_pekerjaan' => $item['id_master_pekerjaan'] ?? null,
                    'id_pic' => $item['id_pic'],
                    'judul' => $item['judul'],
                    'deskripsi' => $item['deskripsi'] ?? null,
                    'lampiran_instruksi' => $lampiranInstruksi,
                    'tgl_penugasan' => $today,
                    'deadline' => $item['deadline'],
                    'periode_bulan' => $item['periode_bulan'] ?? null,
                    'prioritas' => $item['prioritas'] ?? 'sedang',
                    'progress_persen' => 0,
                    'status' => 'baru',
                    'tgl_selesai' => null,
                ]);

                $created[] = $pekerjaan;
            }

            return $created;
        });

        $ids = array_map(fn ($p) => $p->id_pekerjaan, $createdPekerjaan);
        $fullRecords = Pekerjaan::whereIn('id_pekerjaan', $ids)
            ->with(['klien.kontrak.calonKlien', 'klien.kontrak.layanan', 'pic', 'latestReporting', 'layanan', 'masterPekerjaan'])
            ->get();

        return response()->json([
            'message' => count($fullRecords) . ' pekerjaan berhasil ditugaskan sekaligus.',
            'data' => PekerjaanResource::collection($fullRecords),
        ], Response::HTTP_CREATED);
    }

    public function show(Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('view', $pekerjaan);

        return new PekerjaanResource($pekerjaan->load(['klien.kontrak.calonKlien', 'klien.kontrak.layanan', 'pic', 'approver', 'performanceReview', 'latestReporting', 'layanan', 'masterPekerjaan']));
    }

    public function update(UpdatePekerjaanRequest $request, Pekerjaan $pekerjaan): PekerjaanResource
    {
        Gate::authorize('update', $pekerjaan);

        // Pekerjaan yang sudah disetujui / berstatus selesai tidak dapat diedit kembali oleh siapapun
        if (in_array($pekerjaan->status, ['completed', 'approved'])) {
            abort(422, 'Pekerjaan yang telah disetujui dan berstatus selesai tidak dapat diedit kembali.');
        }

        $data = $request->validated();

        if ($request->user()->role === 'karyawan') {
            if ($request->has('id_pic') && (int) $request->input('id_pic') !== (int) $pekerjaan->id_pic) {
                abort(403, 'Karyawan tidak diizinkan mengubah PIC pekerjaan.');
            }
            if ($request->has('tgl_penugasan') && $request->input('tgl_penugasan') !== $pekerjaan->tgl_penugasan?->toDateString()) {
                abort(403, 'Karyawan tidak memiliki hak untuk mengubah tanggal memasukkan tugas.');
            }
            if ($request->has('deadline') && $request->input('deadline') !== $pekerjaan->deadline?->toDateString()) {
                abort(403, 'Karyawan tidak memiliki hak untuk mengubah batas waktu (deadline).');
            }
            if ($request->has('judul') && $request->input('judul') !== $pekerjaan->judul) {
                abort(403, 'Karyawan tidak memiliki hak untuk mengubah judul pekerjaan.');
            }
            if ($request->has('status') && $request->input('status') !== $pekerjaan->status) {
                abort(403, 'Status pekerjaan tidak dapat diubah manual. Pengajuan tugas wajib melalui tombol Submit.');
            }
            // Karyawan hanya boleh memperbarui progress atau catatan jika diperlukan
            $allowed = ['progress_persen', 'deskripsi', 'catatan_review'];
            $data = array_intersect_key($data, array_flip($allowed));

            // Jika pekerjaan sebelumnya berstatus perlu revisi dan diperbarui oleh karyawan,
            // kembalikan status ke 'submitted' agar pimpinan dapat meninjau dan memproses kembali
            if ($pekerjaan->status === 'revision_needed') {
                $data['status'] = 'submitted';
                $data['review_status'] = 'submitted';
                $data['submitted_at'] = now();
                Reporting::where('id_pekerjaan', $pekerjaan->id_pekerjaan)->update([
                    'status_laporan' => 'submitted',
                ]);
            }
        } else {
            // Pimpinan dan Operator tidak mengubah status pekerjaan melalui formulir manual
            // Pimpinan menyelesaikan tugas secara resmi melalui tombol persetujuan (Setujui / Approval)
            unset($data['status'], $data['tgl_selesai']);
        }

        // Penanganan lampiran_instruksi (bisa multiple files)
        $currentDocs = [];
        if ($pekerjaan->lampiran_instruksi) {
            if (str_starts_with($pekerjaan->lampiran_instruksi, '[') && str_ends_with($pekerjaan->lampiran_instruksi, ']')) {
                $decoded = json_decode($pekerjaan->lampiran_instruksi, true);
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
                $p = $pekerjaan->lampiran_instruksi;
                $currentDocs[$p] = ['path' => $p, 'name' => basename($p)];
            }
        }

        $hasExistingInput = $request->has('lampiran_instruksi_existing_present') || $request->has('lampiran_instruksi_existing');
        $finalDocs = [];

        if ($hasExistingInput) {
            $retainedInput = $request->input('lampiran_instruksi_existing', []);
            $retainedArr = is_array($retainedInput) ? $retainedInput : (empty($retainedInput) ? [] : [$retainedInput]);
            foreach ($retainedArr as $rp) {
                if (isset($currentDocs[$rp])) {
                    $finalDocs[] = $currentDocs[$rp];
                    unset($currentDocs[$rp]);
                }
            }
            // Hapus file yang tidak lagi dipertahankan oleh pengguna
            foreach ($currentDocs as $removed) {
                if (Storage::disk('public')->exists($removed['path'])) {
                    Storage::disk('public')->delete($removed['path']);
                }
            }
        } else {
            $finalDocs = array_values($currentDocs);
        }

        // Tambah berkas baru jika diunggah
        if ($request->hasFile('lampiran_instruksi')) {
            $files = $request->file('lampiran_instruksi');
            $files = is_array($files) ? $files : [$files];
            foreach ($files as $f) {
                if ($f instanceof \Illuminate\Http\UploadedFile) {
                    $finalDocs[] = [
                        'path' => FileUploadHelper::storeWithOriginalName($f, 'panduan_tugas', 'public'),
                        'name' => $f->getClientOriginalName(),
                    ];
                }
            }
        }

        if ($hasExistingInput || $request->hasFile('lampiran_instruksi')) {
            $data['lampiran_instruksi'] = !empty($finalDocs) ? json_encode($finalDocs) : null;
        }

        $pekerjaan->update($data);

        return new PekerjaanResource($pekerjaan->load(['klien.kontrak.calonKlien', 'klien.kontrak.layanan', 'pic', 'approver', 'performanceReview', 'latestReporting', 'layanan', 'masterPekerjaan']));
    }

    public function destroy(Pekerjaan $pekerjaan): Response
    {
        Gate::authorize('delete', $pekerjaan);

        $hasReports = $pekerjaan->reporting()->exists();
        $hasReview = $pekerjaan->performanceReview()->exists();
        $isNotBaru = $pekerjaan->status !== 'baru';

        if ($isNotBaru || $hasReports || $hasReview) {
            abort(422, 'Pekerjaan yang sedang berjalan atau sudah selesai/dinilai tidak dapat dihapus demi menjaga riwayat laporan dan penilaian kinerja karyawan.');
        }

        if ($pekerjaan->lampiran_instruksi) {
            if (str_starts_with($pekerjaan->lampiran_instruksi, '[') && str_ends_with($pekerjaan->lampiran_instruksi, ']')) {
                $oldPaths = json_decode($pekerjaan->lampiran_instruksi, true);
                if (is_array($oldPaths)) {
                    foreach ($oldPaths as $oldPath) {
                        $p = is_array($oldPath) ? ($oldPath['path'] ?? '') : $oldPath;
                        if ($p && Storage::disk('public')->exists($p)) {
                            Storage::disk('public')->delete($p);
                        }
                    }
                }
            } elseif (Storage::disk('public')->exists($pekerjaan->lampiran_instruksi)) {
                Storage::disk('public')->delete($pekerjaan->lampiran_instruksi);
            }
        }

        $pekerjaan->delete();

        return response()->noContent();
    }
}
