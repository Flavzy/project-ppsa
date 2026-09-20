<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PublishClientReportRequest;
use App\Http\Resources\ReportingResource;
use App\Models\Reporting;
use Illuminate\Support\Facades\Gate;

class ReportingWorkflowController extends Controller
{
    public function publishClient(PublishClientReportRequest $request, Reporting $reporting): ReportingResource
    {
        Gate::authorize('publishClient', $reporting);

        $validated = $request->validated();

        $reporting->update([
            'tipe_laporan' => 'client',
            'status_laporan' => 'sent',
            'is_visible_to_client' => true,
            'published_at' => now(),
            'catatan' => $validated['catatan'] ?? $reporting->catatan,
        ]);

        return new ReportingResource($reporting->load(['pekerjaan', 'user']));
    }
}
