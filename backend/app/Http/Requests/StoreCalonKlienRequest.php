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
            'id_user' => ['required', 'integer', 'exists:users,id_user'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'kontak' => ['required', 'string', 'max:255'],
            'status_prospek' => ['required', 'string', 'max:255'],
            'tgl_followup' => ['nullable', 'date'],
        ];
    }
}
