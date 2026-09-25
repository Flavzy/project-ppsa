<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePekerjaanRequest extends FormRequest
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
        $pekerjaan = $this->route('pekerjaan');
        $tglPenugasan = $this->input('tgl_penugasan', $pekerjaan?->tgl_penugasan?->toDateString());

        return [
            'id_klien' => ['sometimes', 'required', 'integer', 'exists:klien,id_klien'],
            'id_pic' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('users', 'id_user')->where(fn ($query) => $query->where('role', 'karyawan')),
            ],
            'id_template' => ['nullable', 'integer'],
            'judul' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tgl_penugasan' => ['sometimes', 'nullable', 'date'],
            'deadline' => array_filter([
                'sometimes',
                'required',
                'date',
                $tglPenugasan ? 'after_or_equal:' . $tglPenugasan : null,
            ]),
            'prioritas' => ['nullable', 'string', 'max:255'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['sometimes', 'required', 'string', 'max:255'],
            'tgl_selesai' => ['nullable', 'date'],
            'review_status' => ['nullable', 'string', Rule::in(['pending', 'submitted', 'approved', 'revision_needed'])],
            'catatan_review' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_pic.exists' => 'Penanggung jawab (PIC) harus merupakan pengguna dengan peran Karyawan.',
            'deadline.after_or_equal' => 'Tanggal batas waktu deadline tidak boleh sebelum tanggal memasukkan tugas.',
        ];
    }
}
