<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCalonKlienRequest extends FormRequest
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
            'id_user' => ['sometimes', 'required', 'integer', 'exists:users,id_user'],
            'nama_perusahaan' => ['sometimes', 'required', 'string', 'max:255'],
            'kontak' => ['sometimes', 'required', 'string', 'max:255'],
            'status_prospek' => ['sometimes', 'required', 'string', 'max:255'],
            'tgl_followup' => ['nullable', 'date'],
        ];
    }
}
