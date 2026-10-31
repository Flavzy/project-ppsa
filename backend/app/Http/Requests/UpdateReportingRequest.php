<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportingRequest extends FormRequest
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
            'id_pekerjaan' => ['sometimes', 'required', 'integer', 'exists:pekerjaan,id_pekerjaan'],
            'id_user' => ['nullable', 'integer', 'exists:users,id_user'],
            'tgl_lapor' => ['sometimes', 'required', 'date'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status_laporan' => ['sometimes', 'required', 'string', Rule::in(['draft', 'submitted', 'approved', 'sent', 'revision_needed'])],
            'dokumen_bukti' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    $files = is_array($value) ? $value : [$value];
                    $allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];
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
}
