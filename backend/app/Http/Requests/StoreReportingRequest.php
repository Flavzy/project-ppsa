<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportingRequest extends FormRequest
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
            'id_pekerjaan' => ['required', 'integer', 'exists:pekerjaan,id_pekerjaan'],
            'id_user' => ['nullable', 'integer', 'exists:users,id_user'],
            'tgl_lapor' => ['required', 'date', 'after_or_equal:today', 'before_or_equal:today'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status_laporan' => ['nullable', 'string', Rule::in(['draft', 'submitted', 'approved', 'sent', 'revision_needed'])],
            'dokumen_bukti' => [
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
            'dokumen_bukti_existing' => ['nullable'],
            'dokumen_bukti_existing.*' => ['nullable', 'string'],
            'dokumen_bukti_existing_present' => ['nullable', 'string'],
            'catatan' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tgl_lapor.after_or_equal' => 'Tanggal lapor hanya boleh tanggal hari ini.',
            'tgl_lapor.before_or_equal' => 'Tanggal lapor hanya boleh tanggal hari ini.',
        ];
    }
}
