<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvertLeadRequest extends FormRequest
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
        $calonKlien = $this->route('calonKlien');
        $existingKontrakId = null;
        if ($calonKlien instanceof \App\Models\CalonKlien) {
            $existingKontrakId = $calonKlien->kontrak?->id_kontrak;
        } elseif ($calonKlien) {
            $existingKontrakId = \App\Models\Kontrak::where('id_calon_klien', $calonKlien)->value('id_kontrak');
        }

        return [
            'no_kontrak' => [
                'required',
                'string',
                'max:255',
                Rule::unique('kontrak', 'no_kontrak')->ignore($existingKontrakId, 'id_kontrak'),
            ],
            'jenis_dokumen' => ['required', 'string', Rule::in(['kontrak', 'spk', 'adendum'])],
            'no_spk' => ['nullable', 'string', 'max:255'],
            'tgl_mulai' => ['required', 'date'],
            'tgl_selesai' => ['required', 'date', 'after_or_equal:tgl_mulai'],
            'nilai_proyek' => ['nullable', 'numeric', 'min:0'],
            'lingkup_kerja' => ['nullable', 'string'],
            'alamat' => ['required', 'string'],
            'layanan' => ['required', 'string', 'max:255'],
            'layanan_ids' => ['nullable', 'array'],
            'layanan_ids.*' => ['integer', 'exists:layanan,id_layanan'],
        ];
    }
}
