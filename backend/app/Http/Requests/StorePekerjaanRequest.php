<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePekerjaanRequest extends FormRequest
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
        $tglPenugasan = $this->input('tgl_penugasan') ?: now()->toDateString();

        return [
            'id_klien' => ['required', 'integer', 'exists:klien,id_klien'],
            'id_pic' => [
                'required',
                'integer',
                Rule::exists('users', 'id_user')->where(fn ($query) => $query->where('role', 'karyawan')),
            ],
            'id_template' => ['nullable', 'integer'],
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'tgl_penugasan' => ['nullable', 'date', 'after_or_equal:today'],
            'deadline' => ['required', 'date', 'after_or_equal:today', 'after_or_equal:' . $tglPenugasan],
            'prioritas' => ['nullable', 'string', 'max:255'],
            'progress_persen' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['nullable', 'string', 'max:255'],
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
            'tgl_penugasan.after_or_equal' => 'Tanggal menambahkan tugas tidak boleh dibawah tanggal hari ini.',
            'deadline.after_or_equal' => 'Tanggal batas waktu deadline tidak boleh dibawah tanggal hari ini atau sebelum tanggal memasukkan tugas.',
        ];
    }
}
