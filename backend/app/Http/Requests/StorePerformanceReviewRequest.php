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
            'id_pekerjaan' => ['required', 'integer', 'exists:pekerjaan,id_pekerjaan', Rule::unique('performance_reviews', 'id_pekerjaan')],
            'reviewed_by' => ['nullable', 'integer'],
            'quality_score' => ['required', 'integer', 'min:0', 'max:100'],
            'revision_count' => ['nullable', 'integer', 'min:0'],
            'catatan' => ['nullable', 'string'],
        ];
    }
}
