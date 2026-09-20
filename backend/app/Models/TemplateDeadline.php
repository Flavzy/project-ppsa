<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateDeadline extends Model
{
    use HasFactory;

    protected $table = 'template_deadline';

    protected $primaryKey = 'id_template';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nama_template',
        'keterangan',
    ];

    public function pekerjaan(): HasMany
    {
        return $this->hasMany(Pekerjaan::class, 'id_template', 'id_template');
    }
}
