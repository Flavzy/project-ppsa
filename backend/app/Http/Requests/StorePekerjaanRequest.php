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
        return [
            'id_klien' => ['required', 'integer', 'exists:klien,id_klien'],
            'id_pic' => ['required', 'integer', 'exists:users,id_user'],
            'id_template' => ['required', 'integer', 'exists:template_deadline,id_template'],
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'deadline' => ['required', 'date'],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['required', 'string', 'max:255'],
            'tgl_selesai' => ['nullable', 'date'],
            'review_status' => ['nullable', 'string', Rule::in(['pending', 'submitted', 'approved', 'revision_needed'])],
            'catatan_review' => ['nullable', 'string'],
        ];
    }
}
