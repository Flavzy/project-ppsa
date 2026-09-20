<?php

namespace App\Http\Requests;

use App\Models\PerformanceReview;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePerformanceReviewRequest extends FormRequest
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
        $performanceReview = $this->route('performanceReview');
        $reviewId = $performanceReview instanceof PerformanceReview ? $performanceReview->id_performance_review : null;

        return [
            'id_pekerjaan' => ['sometimes', 'required', 'integer', 'exists:pekerjaan,id_pekerjaan', Rule::unique('performance_reviews', 'id_pekerjaan')->ignore($reviewId, 'id_performance_review')],
            'reviewed_by' => ['sometimes', 'required', 'integer', 'exists:users,id_user'],
            'quality_score' => ['sometimes', 'required', 'integer', 'min:0', 'max:100'],
            'revision_count' => ['nullable', 'integer', 'min:0'],
            'catatan' => ['nullable', 'string'],
        ];
    }
}
