<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePerformanceReviewRequest extends FormRequest
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
            'id_pekerjaan' => [
                'required',
                'integer',
                Rule::exists('pekerjaan', 'id_pekerjaan')->where(function ($query) {
                    $query->whereIn('status', ['completed', 'approved'])
                        ->where('review_status', 'approved');
                }),
                Rule::unique('performance_reviews', 'id_pekerjaan'),
            ],
            'reviewed_by' => ['nullable', 'integer'],
            'quality_score' => ['required', 'integer', 'min:0', 'max:100'],
            'revision_count' => ['nullable', 'integer', 'min:0'],
            'catatan' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_pekerjaan.exists' => 'Penilaian kinerja hanya dapat diberikan untuk pekerjaan yang telah selesai dan disetujui oleh pimpinan.',
            'id_pekerjaan.unique' => 'Pekerjaan ini sudah memiliki catatan evaluasi kinerja.',
        ];
    }
}
