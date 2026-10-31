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
                    SUM(CASE WHEN status = 'baru' THEN 1 ELSE 0 END) as new_tasks,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                    SUM(CASE WHEN status NOT IN ('completed', 'approved') THEN 1 ELSE 0 END) as active_tasks,
                    SUM(CASE WHEN status IN ('revision_needed', 'revision') THEN 1 ELSE 0 END) as revision_tasks
                ", [$today])
                ->first();

            return response()->json([
                'data' => [
                    'totals' => [
                        'tasks' => (int) ($taskAggregates?->total_tasks ?? 0),
                        'overdue_tasks' => (int) ($taskAggregates?->overdue_tasks ?? 0),
                        'completed_tasks' => (int) ($taskAggregates?->completed_tasks ?? 0),
                        'new_tasks' => (int) ($taskAggregates?->new_tasks ?? 0),
                        'in_progress_tasks' => (int) ($taskAggregates?->in_progress_tasks ?? 0),
                        'active_tasks' => (int) ($taskAggregates?->active_tasks ?? 0),
                        'revision_tasks' => (int) ($taskAggregates?->revision_tasks ?? 0),
                        'average_performance_score' => round((float) PerformanceReview::where('id_user', $user->id_user)->avg('final_score'), 2),
                    ],
                    'work_by_status' => $workByStatus,
                    'recent_tasks' => $recentTasks,
                    'monthly_trends' => $this->getMonthlyTrends($user),
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
            $monthlyReminders = $this->getMonthlyReminders($user);

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
                        'pending_monthly_tasks' => count($monthlyReminders),
                    ],
                    'lead_by_status' => $leadByStatus,
                    'contract_by_status' => $contractByStatus,
                    'work_by_status' => $workByStatus,
                    'monthly_reminders' => $monthlyReminders,
                    'monthly_trends' => $this->getMonthlyTrends($user),
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
        $monthlyReminders = $this->getMonthlyReminders($user);

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
                    'pending_monthly_tasks' => count($monthlyReminders),
                    'average_performance_score' => round((float) PerformanceReview::avg('final_score'), 2),
                ],
                'lead_by_status' => $leadByStatus,
                'contract_by_status' => $contractByStatus,
                'work_by_status' => $workByStatus,
                'employee_scores' => $employeeScores,
                'monthly_reminders' => $monthlyReminders,
                'monthly_trends' => $this->getMonthlyTrends($user),
            ],
        ]);
    }

    /**
     * Ambil data tren visual bulanan interaktif (6 bulan terakhir) untuk grafik dashboard.
     *
     * @param \App\Models\User $user
     * @return array<int, array<string, mixed>>
     */
    protected function getMonthlyTrends($user): array
    {
        $months = [];
        $isKaryawan = $user->role === 'karyawan';
        $isOperator = in_array($user->role, ['operator', 'sales'], true);

        // Siapkan rentang 6 bulan terakhir mundur dari awal bulan berjalan tanpa overflow
        for ($i = 5; $i >= 0; $i--) {
            $dt = now()->startOfMonth()->subMonths($i);
            $monthKey = $dt->format('Y-m');
            $months[$monthKey] = [
                'periode' => $monthKey,
                'bulan' => $dt->translatedFormat('F Y'),
                'label' => $dt->translatedFormat('M Y'),
                'short' => $dt->translatedFormat('M'),
                'pekerjaan_total' => 0,
                'pekerjaan_selesai' => 0,
                'kontrak_baru' => 0,
                'nilai_kontrak' => 0,
                'calon_klien' => 0,
                'calon_klien_deal' => 0,
                'work_by_status' => [],
                'lead_by_status' => [],
                'contract_by_status' => [],
            ];
        }

        // 1. Ambil data Pekerjaan
        $pekerjaanQuery = Pekerjaan::query();
        if ($isKaryawan) {
            $pekerjaanQuery->where('id_pic', $user->id_user);
        }
        $allPekerjaan = $pekerjaanQuery->get(['id_pekerjaan', 'status', 'periode_bulan', 'tgl_penugasan']);

        foreach ($allPekerjaan as $p) {
            $pMonth = $p->periode_bulan;
            if (!$pMonth && $p->tgl_penugasan) {
                $pMonth = date('Y-m', strtotime((string) $p->tgl_penugasan));
            }
            if (!$pMonth) {
                $pMonth = now()->format('Y-m');
            }

            if (isset($months[$pMonth])) {
                $months[$pMonth]['pekerjaan_total']++;
                if (in_array($p->status, ['completed', 'approved'], true)) {
                    $months[$pMonth]['pekerjaan_selesai']++;
                }
                $statusKey = $p->status ?: 'baru';
                $months[$pMonth]['work_by_status'][$statusKey] = ($months[$pMonth]['work_by_status'][$statusKey] ?? 0) + 1;
            }
        }

        // 2. Ambil data Kontrak (Untuk Pimpinan, Admin, & Operator)
        if (!$isKaryawan) {
            $kontrakQuery = Kontrak::query();
            if ($isOperator) {
                $kontrakQuery->whereHas('calonKlien', function ($q) use ($user) {
                    $q->where('id_user', $user->id_user);
                });
            }
            $allKontrak = $kontrakQuery->get(['id_kontrak', 'status', 'nilai_proyek', 'tgl_mulai']);

            foreach ($allKontrak as $k) {
                $kMonth = $k->tgl_mulai ? date('Y-m', strtotime((string) $k->tgl_mulai)) : now()->format('Y-m');
                if (isset($months[$kMonth])) {
                    $months[$kMonth]['kontrak_baru']++;
                    $months[$kMonth]['nilai_kontrak'] += (float) ($k->nilai_proyek ?? 0);
                    $kStatus = $k->status ?: 'aktif';
                    $months[$kMonth]['contract_by_status'][$kStatus] = ($months[$kMonth]['contract_by_status'][$kStatus] ?? 0) + 1;
                }
            }

            // 3. Ambil data Calon Klien
            $leadQuery = CalonKlien::query();
            if ($isOperator) {
                $leadQuery->where('id_user', $user->id_user);
            }
            $allLeads = $leadQuery->get(['id_calon_klien', 'status_prospek', 'tgl_followup']);

            foreach ($allLeads as $l) {
                $lMonth = $l->tgl_followup ? date('Y-m', strtotime((string) $l->tgl_followup)) : now()->format('Y-m');
                if (isset($months[$lMonth])) {
                    $months[$lMonth]['calon_klien']++;
                    if ($l->status_prospek === 'deal') {
                        $months[$lMonth]['calon_klien_deal']++;
                    }
                    $lStatus = $l->status_prospek ?: 'prospek';
                    $months[$lMonth]['lead_by_status'][$lStatus] = ($months[$lMonth]['lead_by_status'][$lStatus] ?? 0) + 1;
                }
            }
        }

        return array_values($months);
    }

    /**
     * Ambil daftar tugas bulanan dari kontrak aktif yang belum ditugaskan untuk bulan ini.
     *
     * @param \App\Models\User $user
     * @return array<int, array<string, mixed>>
     */
    protected function getMonthlyReminders($user): array
    {
        $currentMonth = now()->format('Y-m');

        // Ambil seluruh klien yang memiliki kontrak berstatus 'aktif'
        $clientsQuery = Klien::query()
            ->whereHas('kontrak', function ($q) {
                $q->where('status', 'aktif');
            })
            ->with([
                'kontrak' => function ($q) {
                    $q->with([
                        'layanan.masterPekerjaan' => function ($mq) {
                            $mq->where('is_active', true)
                               ->where('sifat_periode', 'bulanan');
                        },
                        'calonKlien',
                    ]);
                },
                'pekerjaan' => function ($q) use ($currentMonth) {
                    $q->where('periode_bulan', $currentMonth);
                },
            ]);

        // Jika role operator / sales: hanya tampilkan klien milik operator PIC tersebut
        if (in_array($user->role, ['operator', 'sales'], true)) {
            $clientsQuery->whereHas('kontrak.calonKlien', function ($q) use ($user) {
                $q->where('id_user', $user->id_user);
            });
        }

        $clients = $clientsQuery->get();

        $allActiveServices = null;
        $reminders = [];

        foreach ($clients as $client) {
            $kontrak = $client->kontrak;
            if (!$kontrak) {
                continue;
            }

            // Dapatkan layanan dari kontrak
            $services = $kontrak->layanan;
            if ($services->isEmpty()) {
                if ($allActiveServices === null) {
                    $allActiveServices = \App\Models\Layanan::where('is_active', true)
                        ->with(['masterPekerjaan' => function ($q) {
                            $q->where('is_active', true)->where('sifat_periode', 'bulanan');
                        }])
                        ->get();
                }
                $services = $allActiveServices;
            }

            $existingJobs = $client->pekerjaan;

            foreach ($services as $layanan) {
                $monthlyTemplates = $layanan->masterPekerjaan
                    ->where('is_active', true)
                    ->where('sifat_periode', 'bulanan');

                foreach ($monthlyTemplates as $template) {
                    $alreadyAssigned = $existingJobs->contains(function ($job) use ($template, $layanan) {
                        if ($job->id_master_pekerjaan && (int) $job->id_master_pekerjaan === (int) $template->id_master_pekerjaan) {
                            return true;
                        }
                        if ((int) $job->id_layanan === (int) $layanan->id_layanan &&
                            stripos($job->judul, $template->nama_pekerjaan) !== false) {
                            return true;
                        }
                        return false;
                    });

                    if (!$alreadyAssigned) {
                        $reminders[] = [
                            'id_klien' => (int) $client->id_klien,
                            'nama_perusahaan' => $client->nama_perusahaan,
                            'id_kontrak' => (int) $kontrak->id_kontrak,
                            'no_kontrak' => $kontrak->no_kontrak,
                            'id_layanan' => (int) $layanan->id_layanan,
                            'nama_layanan' => $layanan->nama_layanan,
                            'id_master_pekerjaan' => (int) $template->id_master_pekerjaan,
                            'nama_pekerjaan' => $template->nama_pekerjaan,
                            'estimasi_hari' => (int) ($template->estimasi_hari ?: 7),
                            'periode_bulan' => $currentMonth,
                        ];
                    }
                }
            }
        }

        return $reminders;
    }
}
