<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKontrakRequest extends FormRequest
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
            'id_calon_klien' => ['required', 'integer', 'exists:calon_klien,id_calon_klien', Rule::unique('kontrak', 'id_calon_klien')],
            'no_kontrak' => ['required', 'string', 'max:255', Rule::unique('kontrak', 'no_kontrak')],
            'jenis_dokumen' => ['nullable', 'string', Rule::in(['kontrak', 'spk'])],
            'no_spk' => ['nullable', 'string', 'max:255'],
            'nilai_proyek' => ['nullable', 'numeric', 'min:0'],
            'lingkup_kerja' => ['nullable', 'string'],
            'tgl_mulai' => ['required', 'date'],
            'tgl_selesai' => ['required', 'date', 'after_or_equal:tgl_mulai'],
            'status' => ['required', 'string', 'max:255'],
            'dokumen_draft' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'dokumen_final' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'ditandatangani_pada' => ['nullable', 'date'],
            'reviewed_by' => ['nullable', 'integer', 'exists:users,id_user'],
        ];
    }
}
