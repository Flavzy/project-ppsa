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
                    'submitted_at' => $p->submitted_at?->toDateTimeString(),
                    'tgl_selesai' => $p->tgl_selesai?->toDateString(),
                    'catatan_review' => $p->catatan_review,
                    'catatan_karyawan' => $p->catatan_karyawan,
                    'deskripsi' => $p->deskripsi,
                ]);

            $today = today()->toDateString();
            $taskAggregates = Pekerjaan::query()
                ->where('id_pic', $user->id_user)
                ->selectRaw("
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN deadline < ? AND status NOT IN ('completed', 'approved') THEN 1 ELSE 0 END) as overdue_tasks,
                    SUM(CASE WHEN status IN ('completed', 'approved') THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN status IN ('revision_needed', 'revision') THEN 1 ELSE 0 END) as revision_tasks
                ", [$today])
                ->first();

            return response()->json([
                'data' => [
                    'totals' => [
                        'tasks' => (int) ($taskAggregates?->total_tasks ?? 0),
                        'overdue_tasks' => (int) ($taskAggregates?->overdue_tasks ?? 0),
                        'completed_tasks' => (int) ($taskAggregates?->completed_tasks ?? 0),
                        'revision_tasks' => (int) ($taskAggregates?->revision_tasks ?? 0),
                        'average_performance_score' => round((float) PerformanceReview::where('id_user', $user->id_user)->avg('final_score'), 2),
                    ],
                    'work_by_status' => $workByStatus,
                    'recent_tasks' => $recentTasks,
                ],
            ]);
        }

        // Operator / Sales role: CRM leads, contract metrics, and operational task metrics
        if (in_array($user->role, ['operator', 'sales'], true)) {
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

            $leadTotal = (int) $leadByStatus->sum();
            $leadDeal = (int) ($leadByStatus['deal'] ?? 0);
            $contractTotal = (int) $contractByStatus->sum();
            $workTotal = (int) $workByStatus->sum();
            $inProgressTasks = (int) ($workByStatus['in_progress'] ?? 0);
            $submittedTasks = (int) ($workByStatus['submitted'] ?? 0);
            $completedTasks = (int) (($workByStatus['completed'] ?? 0) + ($workByStatus['approved'] ?? 0));

            $overdueTasks = Pekerjaan::query()
                ->whereDate('deadline', '<', today())
                ->whereNotIn('status', ['completed', 'approved'])
                ->count();

            $activeClients = Klien::count();

            return response()->json([
                'data' => [
                    'totals' => [
                        'leads' => $leadTotal,
                        'lead_deal' => $leadDeal,
                        'lead_lost' => $leadTotal - $leadDeal,
                        'active_clients' => $activeClients,
                        'contracts' => $contractTotal,
                        'tasks' => $workTotal,
                        'in_progress_tasks' => $inProgressTasks,
                        'submitted_tasks' => $submittedTasks,
                        'overdue_tasks' => $overdueTasks,
                        'completed_tasks' => $completedTasks,
                    ],
                    'lead_by_status' => $leadByStatus,
                    'contract_by_status' => $contractByStatus,
                    'work_by_status' => $workByStatus,
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

        $leadTotal = (int) $leadByStatus->sum();
        $leadDeal = (int) ($leadByStatus['deal'] ?? 0);
        $contractTotal = (int) $contractByStatus->sum();
        $workTotal = (int) $workByStatus->sum();
        $completedTasks = (int) (($workByStatus['completed'] ?? 0) + ($workByStatus['approved'] ?? 0));

        $overdueTasks = Pekerjaan::query()
            ->whereDate('deadline', '<', today())
            ->whereNotIn('status', ['completed', 'approved'])
            ->count();

        $activeClients = Klien::count();

        return response()->json([
            'data' => [
                'totals' => [
                    'leads' => $leadTotal,
                    'lead_deal' => $leadDeal,
                    'lead_lost' => $leadTotal - $leadDeal,
                    'active_clients' => $activeClients,
                    'contracts' => $contractTotal,
                    'tasks' => $workTotal,
                    'overdue_tasks' => $overdueTasks,
                    'completed_tasks' => $completedTasks,
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
