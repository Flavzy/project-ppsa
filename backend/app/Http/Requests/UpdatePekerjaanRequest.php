<?php

namespace App\Http\Requests;

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
        $tglPenugasan = $this->input('tgl_penugasan', $pekerjaan?->tgl_penugasan?->toDateString());

        return [
            'id_klien' => ['sometimes', 'required', 'integer', 'exists:klien,id_klien'],
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
            'deadline' => array_filter([
                'sometimes',
                'required',
                'date',
                $tglPenugasan ? 'after_or_equal:' . $tglPenugasan : null,
            ]),
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
