<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportingResource;
use App\Models\Reporting;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientReportController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $reports = Reporting::query()
            ->with(['pekerjaan.klien', 'pekerjaan.pic', 'user'])
            ->where('is_visible_to_client', true)
            ->whereIn('status_laporan', ['approved', 'sent'])
            ->orderByDesc('published_at')
            ->orderByDesc('tgl_lapor')
            ->get();

        return ReportingResource::collection($reports);
    }
}
