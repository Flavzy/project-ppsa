<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'deadline' => ['required', 'date'],
            'status' => ['required', 'string', 'max:255'],
            'tgl_selesai' => ['nullable', 'date'],
        ];
    }
}
