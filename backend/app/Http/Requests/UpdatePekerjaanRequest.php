<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'id_klien' => ['sometimes', 'required', 'integer', 'exists:klien,id_klien'],
            'id_pic' => ['sometimes', 'required', 'integer', 'exists:users,id_user'],
            'id_template' => ['sometimes', 'required', 'integer', 'exists:template_deadline,id_template'],
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'deadline' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', 'string', 'max:255'],
            'tgl_selesai' => ['nullable', 'date'],
        ];
    }
}
