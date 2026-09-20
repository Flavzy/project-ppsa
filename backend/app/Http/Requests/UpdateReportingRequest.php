<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportingRequest extends FormRequest
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
            'id_pekerjaan' => ['sometimes', 'required', 'integer', 'exists:pekerjaan,id_pekerjaan'],
            'id_user' => ['nullable', 'integer', 'exists:users,id_user'],
            'tgl_lapor' => ['sometimes', 'required', 'date'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'tipe_laporan' => ['sometimes', 'required', 'string', Rule::in(['internal', 'client'])],
            'status_laporan' => ['sometimes', 'required', 'string', Rule::in(['draft', 'submitted', 'approved', 'sent'])],
            'is_visible_to_client' => ['nullable', 'boolean'],
            'dokumen_bukti' => ['nullable'],
            'catatan' => ['nullable', 'string'],
        ];
    }
}
