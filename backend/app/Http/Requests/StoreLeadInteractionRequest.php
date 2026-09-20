<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadInteractionRequest extends FormRequest
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
            'id_calon_klien' => ['required', 'integer', 'exists:calon_klien,id_calon_klien'],
            'id_user' => ['required', 'integer', 'exists:users,id_user'],
            'tipe_interaksi' => ['required', 'string', Rule::in(['telepon', 'email', 'meeting', 'follow_up', 'proposal', 'negosiasi'])],
            'tanggal_interaksi' => ['required', 'date'],
            'ringkasan' => ['required', 'string'],
            'hasil' => ['nullable', 'string'],
            'jadwal_followup' => ['nullable', 'date'],
        ];
    }
}
