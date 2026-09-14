<?php

namespace App\Http\Requests;

use App\Models\Kontrak;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKontrakRequest extends FormRequest
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
        $kontrak = $this->route('kontrak');
        $kontrakId = $kontrak instanceof Kontrak ? $kontrak->id_kontrak : null;

        return [
            'id_calon_klien' => ['sometimes', 'required', 'integer', 'exists:calon_klien,id_calon_klien', Rule::unique('kontrak', 'id_calon_klien')->ignore($kontrakId, 'id_kontrak')],
            'no_kontrak' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('kontrak', 'no_kontrak')->ignore($kontrakId, 'id_kontrak')],
            'tgl_mulai' => ['sometimes', 'required', 'date'],
            'tgl_selesai' => ['sometimes', 'required', 'date', 'after_or_equal:tgl_mulai'],
            'status' => ['sometimes', 'required', 'string', 'max:255'],
        ];
    }
}
