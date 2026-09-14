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
            'tgl_mulai' => ['required', 'date'],
            'tgl_selesai' => ['required', 'date', 'after_or_equal:tgl_mulai'],
            'status' => ['required', 'string', 'max:255'],
        ];
    }
}
