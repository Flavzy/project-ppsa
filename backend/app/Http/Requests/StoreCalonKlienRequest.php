<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCalonKlienRequest extends FormRequest
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
        return [
            'id_user' => ['nullable', 'integer', 'exists:users,id_user'],
            'nama_klien' => ['nullable', 'string', 'max:255'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'alamat_perusahaan' => ['nullable', 'string'],
            'nama_direktur' => ['nullable', 'string', 'max:255'],
            'kontak_person' => ['nullable', 'string', 'max:16', 'regex:/^[0-9]+$/'],
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'kontak' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'pain_points' => ['nullable', 'string'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'timeline' => ['nullable', 'string', 'max:255'],
            'lead_source' => ['nullable', 'string', 'max:255'],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'nilai_estimasi' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'status_prospek' => ['nullable', 'string', 'max:255'],
            'tgl_followup' => ['nullable', 'date', 'after_or_equal:today', 'before_or_equal:today'],
            'layanan_ids' => ['nullable', 'array'],
            'layanan_ids.*' => ['integer', 'exists:layanan,id_layanan'],

            // Nomor Legalitas
            'nomor_nib' => ['nullable', 'string', 'max:255'],
            'nomor_npwp' => ['nullable', 'string', 'max:255'],
            'nomor_akta_pendirian' => ['nullable', 'string', 'max:255'],
            'nomor_sk_kemenkumham' => ['nullable', 'string', 'max:255'],
            'nomor_izin_usaha' => ['nullable', 'string', 'max:255'],

            // Dokumen Legalitas (File upload)
            'file_nib' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'file_npwp' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'file_akta_pendirian' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'file_sk_kemenkumham' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'file_izin_usaha' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'file_dokumen_pendukung' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    $files = is_array($value) ? $value : [$value];
                    $allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
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
            'file_dokumen_pendukung_existing' => ['nullable'],
            'file_dokumen_pendukung_existing.*' => ['nullable', 'string'],
            'file_dokumen_pendukung_existing_present' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tgl_followup.after_or_equal' => 'Tanggal follow up hanya boleh tanggal hari ini.',
            'tgl_followup.before_or_equal' => 'Tanggal follow up hanya boleh tanggal hari ini.',
        ];
    }
}
