<?php

namespace App\Http\Requests;

use App\Models\Pekerjaan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePekerjaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pekerjaan = $this->route('pekerjaan');
        if (!($pekerjaan instanceof Pekerjaan) && $pekerjaan) {
            $pekerjaan = Pekerjaan::find($pekerjaan);
        }
        $tglPenugasan = $this->input('tgl_penugasan', $pekerjaan?->tgl_penugasan ? \Carbon\Carbon::parse($pekerjaan->tgl_penugasan)->toDateString() : null);

        return [
            'id_klien' => [
                'sometimes',
                'required',
                'integer',
                'exists:klien,id_klien',
                function ($attribute, $value, $fail) use ($pekerjaan) {
                    if ($pekerjaan && (int) $value === (int) $pekerjaan->id_klien) {
                        return; // Mempertahankan data historis tugas lama
                    }
                    $klien = \App\Models\Klien::with('kontrak')->find($value);
                    if (!$klien || !$klien->kontrak || $klien->kontrak->status !== 'aktif') {
                        $fail('Pekerjaan tidak dapat dipindahkan karena kontrak klien sedang nonaktif atau telah dibatalkan.');
                    }
                },
            ],
            'id_layanan' => ['nullable', 'integer', 'exists:layanan,id_layanan'],
            'id_master_pekerjaan' => ['nullable', 'integer', 'exists:master_pekerjaan,id_master_pekerjaan'],
            'periode_bulan' => [
                'nullable',
                'string',
                'max:20',
                function ($attribute, $value, $fail) use ($pekerjaan) {
                    if (!empty($value) && $value !== $pekerjaan?->periode_bulan && $value < now()->format('Y-m')) {
                        $fail('Bulan pengerjaan tidak boleh sebelum bulan ini.');
                    }
                },
            ],
            'id_pic' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('users', 'id_user')->where(fn ($query) => $query->where('role', 'karyawan')),
            ],
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'lampiran_instruksi' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    $files = is_array($value) ? $value : [$value];
                    $allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
                    foreach ($files as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile) {
                            if ($file->getSize() > 20480 * 1024) {
                                $fail("Ukuran file {$file->getClientOriginalName()} melebihi batas 20MB.");
                            }
                            $ext = strtolower($file->getClientOriginalExtension());
                            if (!in_array($ext, $allowedExts, true)) {
                                $fail("Format file {$file->getClientOriginalName()} ({$ext}) tidak didukung.");
                            }
                        }
                    }
                },
            ],
            'lampiran_instruksi_existing' => ['nullable'],
            'lampiran_instruksi_existing.*' => ['nullable', 'string'],
            'lampiran_instruksi_existing_present' => ['nullable', 'string'],
            'tgl_penugasan' => ['sometimes', 'nullable', 'date'],
            'deadline' => [
                'sometimes',
                'required',
                'date',
                function ($attribute, $value, $fail) use ($pekerjaan, $tglPenugasan) {
                    $today = now()->toDateString();
                    $originalDeadline = $pekerjaan?->deadline ? \Carbon\Carbon::parse($pekerjaan->deadline)->toDateString() : null;
                    if ($value !== $originalDeadline && $value < $today) {
                        $fail('Batas waktu (deadline) tidak boleh sebelum hari ini.');
                    }
                    if ($tglPenugasan && $value < $tglPenugasan) {
                        $fail('Tanggal batas waktu deadline tidak boleh sebelum tanggal memasukkan tugas.');
                    }
                },
            ],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['sometimes', 'required', 'string', 'max:255'],
            'tgl_selesai' => ['nullable', 'date'],
            'review_status' => ['nullable', 'string', Rule::in(['pending', 'submitted', 'approved', 'revision_needed'])],
            'catatan_review' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_pic.exists' => 'Penanggung jawab (PIC) harus merupakan pengguna dengan peran Karyawan.',
            'deadline.after_or_equal' => 'Tanggal batas waktu deadline tidak boleh sebelum tanggal memasukkan tugas.',
        ];
    }
}
