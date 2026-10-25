<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMasterPekerjaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_layanan' => ['sometimes', 'required', 'integer', 'exists:layanan,id_layanan'],
            'nama_pekerjaan' => ['sometimes', 'required', 'string', 'max:255'],
            'sifat_periode' => ['sometimes', 'required', 'string', Rule::in(['sekali_selesai', 'bulanan', 'tahunan'])],
            'template_instruksi' => ['nullable', 'string'],
            'estimasi_hari' => ['nullable', 'integer', 'min:1', 'max:365'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
