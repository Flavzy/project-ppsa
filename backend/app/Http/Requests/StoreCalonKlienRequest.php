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
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'kontak' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'pain_points' => ['nullable', 'string'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'timeline' => ['nullable', 'string', 'max:255'],
            'lead_source' => ['nullable', 'string', 'max:255'],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'nilai_estimasi' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string'],
            'status_prospek' => ['required', 'string', 'max:255'],
            'tgl_followup' => ['nullable', 'date'],
        ];
    }
}
