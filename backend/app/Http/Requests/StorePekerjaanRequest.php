<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePekerjaanRequest extends FormRequest
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
        $tglPenugasan = $this->input('tgl_penugasan') ?: now()->toDateString();

        return [
            'id_klien' => ['required', 'integer', 'exists:klien,id_klien'],
            'id_layanan' => ['nullable', 'integer', 'exists:layanan,id_layanan'],
            'id_master_pekerjaan' => ['nullable', 'integer', 'exists:master_pekerjaan,id_master_pekerjaan'],
            'periode_bulan' => [
                'nullable',
                'string',
                'max:20',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && $value < now()->format('Y-m')) {
                        $fail('Bulan pengerjaan tidak boleh sebelum bulan ini.');
                    }
                },
            ],
            'id_pic' => [
                'required',
                'integer',
                Rule::exists('users', 'id_user')->where(fn ($query) => $query->where('role', 'karyawan')),
            ],
            'judul' => ['required', 'string', 'max:255'],
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
            'tgl_penugasan' => ['nullable', 'date', 'after_or_equal:today', 'before_or_equal:today'],
            'deadline' => ['required', 'date', 'after_or_equal:today', 'after_or_equal:' . $tglPenugasan],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['nullable', 'string', 'max:255'],
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
            'tgl_penugasan.after_or_equal' => 'Tanggal memasukkan tugas hanya boleh tanggal hari ini.',
            'tgl_penugasan.before_or_equal' => 'Tanggal memasukkan tugas hanya boleh tanggal hari ini.',
            'deadline.after_or_equal' => 'Tanggal batas waktu deadline tidak boleh dibawah tanggal hari ini atau sebelum tanggal memasukkan tugas.',
        ];
    }
}
