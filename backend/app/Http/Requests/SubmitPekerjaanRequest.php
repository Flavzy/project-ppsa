<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SubmitPekerjaanRequest extends FormRequest
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
            'file_tugas' => ['required', 'file', 'max:25600'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file_tugas.required' => 'File tugas yang telah selesai wajib dilampirkan.',
            'file_tugas.file' => 'Berkas tugas harus berupa file yang valid.',
            'file_tugas.max' => 'Ukuran file tugas maksimal 25 MB.',
        ];
    }
}
