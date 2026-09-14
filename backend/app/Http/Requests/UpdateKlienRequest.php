<?php

namespace App\Http\Requests;

use App\Models\Klien;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKlienRequest extends FormRequest
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
        $klien = $this->route('klien');
        $klienId = $klien instanceof Klien ? $klien->id_klien : null;

        return [
            'id_kontrak' => ['sometimes', 'required', 'integer', 'exists:kontrak,id_kontrak', Rule::unique('klien', 'id_kontrak')->ignore($klienId, 'id_klien')],
            'nama_perusahaan' => ['sometimes', 'required', 'string', 'max:255'],
            'alamat' => ['sometimes', 'required', 'string'],
            'kontak' => ['sometimes', 'required', 'string', 'max:255'],
            'layanan' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
