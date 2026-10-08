<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardSummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        // Karyawan role: personal task metrics, personal performance score, and task list
        if ($user->role === 'karyawan') {
            $workByStatus = Pekerjaan::query()
                ->where('id_pic', $user->id_user)
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $recentTasks = Pekerjaan::query()
                ->with('klien')
                ->where('id_pic', $user->id_user)
                ->orderByDesc('id_pekerjaan')
                ->get()
                ->map(fn (Pekerjaan $p): array => [
                    'id_pekerjaan' => $p->id_pekerjaan,
                    'judul' => $p->judul,
                    'klien' => $p->klien?->nama_perusahaan ?? '-',
                    'tgl_penugasan' => $p->tgl_penugasan?->toDateString() ?? '-',
                    'deadline' => $p->deadline?->toDateString() ?? '-',
                    'status' => $p->status,
                    'progress_persen' => $p->progress_persen,
                ]);

            return response()->json([
                'data' => [
                    'totals' => [
                        'tasks' => Pekerjaan::where('id_pic', $user->id_user)->count(),
                        'overdue_tasks' => Pekerjaan::where('id_pic', $user->id_user)
                            ->whereDate('deadline', '<', today())
                            ->whereNotIn('status', ['completed', 'approved'])
                            ->count(),
                        'completed_tasks' => Pekerjaan::where('id_pic', $user->id_user)
                            ->whereIn('status', ['completed', 'approved'])
                            ->count(),
                        'average_performance_score' => round((float) PerformanceReview::where('id_user', $user->id_user)->avg('final_score'), 2),
                    ],
                    'work_by_status' => $workByStatus,
                    'recent_tasks' => $recentTasks,
                ],
            ]);
        }

        // Operator / Sales role: CRM leads and contract metrics
        if (in_array($user->role, ['operator', 'sales'], true)) {
            $leadByStatus = CalonKlien::query()
                ->selectRaw('status_prospek as status, count(*) as total')
                ->groupBy('status_prospek')
                ->pluck('total', 'status');

            $contractByStatus = Kontrak::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            return response()->json([
                'data' => [
                    'totals' => [
                        'leads' => CalonKlien::count(),
                        'lead_deal' => CalonKlien::where('status_prospek', 'deal')->count(),
                        'lead_lost' => CalonKlien::where('status_prospek', 'lost')->count(),
                        'active_clients' => Klien::count(),
                        'contracts' => Kontrak::count(),
                    ],
                    'lead_by_status' => $leadByStatus,
                    'contract_by_status' => $contractByStatus,
                ],
            ]);
        }

        // Admin & Pimpinan: full global company metrics
        $leadByStatus = CalonKlien::query()
            ->selectRaw('status_prospek as status, count(*) as total')
            ->groupBy('status_prospek')
            ->pluck('total', 'status');

        $contractByStatus = Kontrak::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $workByStatus = Pekerjaan::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $employeeScores = PerformanceReview::query()
            ->with('user')
            ->selectRaw('id_user, avg(final_score) as average_score, count(*) as total_reviews')
            ->groupBy('id_user')
            ->orderByDesc('average_score')
            ->limit(5)
            ->get()
            ->map(fn (PerformanceReview $review): array => [
                'id_user' => $review->id_user,
                'nama' => $review->user?->nama,
                'average_score' => round((float) $review->average_score, 2),
                'total_reviews' => (int) $review->total_reviews,
            ]);

        return response()->json([
            'data' => [
                'totals' => [
                    'leads' => CalonKlien::count(),
                    'lead_deal' => CalonKlien::where('status_prospek', 'deal')->count(),
                    'lead_lost' => CalonKlien::where('status_prospek', 'lost')->count(),
                    'active_clients' => Klien::count(),
                    'contracts' => Kontrak::count(),
                    'tasks' => Pekerjaan::count(),
                    'overdue_tasks' => Pekerjaan::whereDate('deadline', '<', today())
                        ->whereNotIn('status', ['completed', 'approved'])
                        ->count(),
                    'client_reports_sent' => Reporting::where('is_visible_to_client', true)->count(),
                    'average_performance_score' => round((float) PerformanceReview::avg('final_score'), 2),
                ],
                'lead_by_status' => $leadByStatus,
                'contract_by_status' => $contractByStatus,
                'work_by_status' => $workByStatus,
                'employee_scores' => $employeeScores,
            ],
        ]);
    }
}
