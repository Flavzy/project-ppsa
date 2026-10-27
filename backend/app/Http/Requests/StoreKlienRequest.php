<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKlienRequest extends FormRequest
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
            'id_kontrak' => ['required', 'integer', 'exists:kontrak,id_kontrak', Rule::unique('klien', 'id_kontrak')],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'kontak' => ['required', 'string', 'max:255'],
            'layanan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'layanan_ids' => ['sometimes', 'nullable', 'array'],
            'layanan_ids.*' => ['integer', 'exists:layanan,id_layanan'],
        ];
    }
}
