<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportingRequest extends FormRequest
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
            'id_pekerjaan' => ['required', 'integer', 'exists:pekerjaan,id_pekerjaan'],
            'id_user' => ['nullable', 'integer', 'exists:users,id_user'],
            'tgl_lapor' => ['required', 'date'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'tipe_laporan' => ['nullable', 'string', Rule::in(['internal', 'client'])],
            'status_laporan' => ['nullable', 'string', Rule::in(['draft', 'submitted', 'approved', 'sent'])],
            'is_visible_to_client' => ['nullable', 'boolean'],
            'dokumen_bukti' => ['nullable'],
            'catatan' => ['nullable', 'string'],
        ];
    }
}
