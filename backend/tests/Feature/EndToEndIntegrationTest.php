<?php

namespace Tests\Feature;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\LeadInteraction;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use App\Models\TemplateDeadline;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EndToEndIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * TC-AUTH-01: Admin Login Lifecycle
     */
    public function test_tc_auth_01_admin_login_lifecycle(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin.test@example.com',
            'password' => Hash::make('secretAdmin123'),
            'role' => 'admin',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin.test@example.com',
            'password' => 'secretAdmin123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.email', 'admin.test@example.com')
            ->assertJsonMissing(['password']);

        $token = $loginResponse->json('token');
        $this->assertNotEmpty($token);

        // Bearer token used for /api/auth/me
        $meResponse = $this->withToken($token)->getJson('/api/auth/me');
        $meResponse->assertOk()
            ->assertJsonPath('user.id_user', $admin->id_user)
            ->assertJsonPath('user.role', 'admin');

        // Admin can access full dashboard and calon-klien
        $this->withToken($token)->getJson('/api/dashboard-summary')->assertOk();
        $this->withToken($token)->getJson('/api/calon-klien')->assertOk();
        $this->withToken($token)->getJson('/api/pekerjaan')->assertOk();
    }

    /**
     * TC-AUTH-02: Sales Login Lifecycle & Role Restrictions
     */
    public function test_tc_auth_02_sales_login_lifecycle(): void
    {
        $sales = User::factory()->create([
            'email' => 'sales.test@example.com',
            'password' => Hash::make('secretSales123'),
            'role' => 'sales',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'sales.test@example.com',
            'password' => 'secretSales123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('user.role', 'sales');

        $token = $loginResponse->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'sales');

        // Sales can access CRM routes
        $this->withToken($token)->getJson('/api/calon-klien')->assertOk();
        $this->withToken($token)->getJson('/api/kontrak')->assertOk();
        $this->withToken($token)->getJson('/api/klien')->assertOk();

        // Sales cannot access internal operational routes (403 Forbidden)
        $this->withToken($token)->getJson('/api/pekerjaan')->assertForbidden();
        $this->withToken($token)->getJson('/api/reporting')->assertForbidden();
        $this->withToken($token)->getJson('/api/performance-reviews')->assertForbidden();
    }

    /**
     * TC-AUTH-03: Karyawan Login Lifecycle & Role Restrictions
     */
    public function test_tc_auth_03_karyawan_login_lifecycle(): void
    {
        $karyawan = User::factory()->create([
            'email' => 'karyawan.test@example.com',
            'password' => Hash::make('secretKaryawan123'),
            'role' => 'karyawan',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'karyawan.test@example.com',
            'password' => 'secretKaryawan123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('user.role', 'karyawan');

        $token = $loginResponse->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'karyawan');

        // Karyawan can access operational routes
        $this->withToken($token)->getJson('/api/pekerjaan')->assertOk();
        $this->withToken($token)->getJson('/api/reporting')->assertOk();
        $this->withToken($token)->getJson('/api/template-deadline')->assertOk();

        // Karyawan cannot access CRM routes (403 Forbidden)
        $this->withToken($token)->getJson('/api/calon-klien')->assertForbidden();
        $this->withToken($token)->getJson('/api/kontrak')->assertForbidden();
        $this->withToken($token)->getJson('/api/klien')->assertForbidden();
    }

    /**
     * TC-AUTH-04: Pimpinan Login Lifecycle & Role Permissions
     */
    public function test_tc_auth_04_pimpinan_login_lifecycle(): void
    {
        $pimpinan = User::factory()->create([
            'email' => 'pimpinan.test@example.com',
            'password' => Hash::make('secretPimpinan123'),
            'role' => 'pimpinan',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'pimpinan.test@example.com',
            'password' => 'secretPimpinan123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('user.role', 'pimpinan');

        $token = $loginResponse->json('token');

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'pimpinan');

        // Pimpinan has comprehensive overview access
        $this->withToken($token)->getJson('/api/calon-klien')->assertOk();
        $this->withToken($token)->getJson('/api/pekerjaan')->assertOk();
        $this->withToken($token)->getJson('/api/kontrak')->assertOk();
        $this->withToken($token)->getJson('/api/dashboard-summary')->assertOk();
    }

    /**
     * TC-AUTH-05: Login Rejection on Invalid Credentials
     */
    public function test_tc_auth_05_invalid_login_rejected(): void
    {
        User::factory()->create([
            'email' => 'valid@example.com',
            'password' => Hash::make('correctPassword'),
        ]);

        // Wrong password
        $this->postJson('/api/auth/login', [
            'email' => 'valid@example.com',
            'password' => 'wrongPassword',
        ])->assertUnauthorized();

        // Unknown email
        $this->postJson('/api/auth/login', [
            'email' => 'unknown@example.com',
            'password' => 'anyPassword',
        ])->assertUnauthorized();

        // Missing fields (validation error 422)
        $this->postJson('/api/auth/login', [
            'email' => '',
            'password' => '',
        ])->assertUnprocessable();

        // Ensure no tokens were generated
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /**
     * TC-RESTORE: Session Restoration and Revocation
     */
    public function test_tc_session_restoration_and_revocation(): void
    {
        $user = User::factory()->create(['role' => 'karyawan']);
        $token = $user->createToken('session_token')->plainTextToken;

        // Session restoration works
        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id_user', $user->id_user);

        // Logout invalidates session
        $this->withToken($token)->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout berhasil.');

        // Restoring session with revoked token fails
        $this->withToken($token)->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    /**
     * TC-OWN & TC-IDOR: Own Resource Access & IDOR Cross-Owner Protection
     */
    public function test_tc_own_resource_and_idor_protection(): void
    {
        $salesA = User::factory()->create(['role' => 'sales']);
        $salesB = User::factory()->create(['role' => 'sales']);

        $leadA = CalonKlien::factory()->deal()->create([
            'id_user' => $salesA->id_user,
            'nama_perusahaan' => 'PT Perusahaan Milik A',
        ]);
        $leadB = CalonKlien::factory()->deal()->create([
            'id_user' => $salesB->id_user,
            'nama_perusahaan' => 'PT Perusahaan Milik B',
        ]);

        $tokenA = $salesA->createToken('salesA')->plainTextToken;
        $tokenB = $salesB->createToken('salesB')->plainTextToken;

        // Sales A can view and update own lead
        $this->withToken($tokenA)->getJson("/api/calon-klien/{$leadA->id_calon_klien}")
            ->assertOk();
        $this->withToken($tokenA)->putJson("/api/calon-klien/{$leadA->id_calon_klien}", [
            'nama_perusahaan' => 'PT Perusahaan Milik A Update',
        ])->assertOk();

        // Sales A CANNOT update Sales B's lead (IDOR blocked -> 403)
        $this->withToken($tokenA)->putJson("/api/calon-klien/{$leadB->id_calon_klien}", [
            'nama_perusahaan' => 'PT Pembajakan Lead B',
        ])->assertForbidden();

        // Sales A CANNOT convert Sales B's lead (IDOR blocked -> 403)
        $this->withToken($tokenA)->postJson("/api/calon-klien/{$leadB->id_calon_klien}/convert", [
            'no_kontrak' => 'KTR-HIJACK-002',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-19',
            'tgl_selesai' => '2026-10-19',
            'alamat' => 'Jl. Hijack',
            'layanan' => 'Layanan Hijack',
        ])->assertForbidden();

        // Lead B remains untouched
        $this->assertEquals('PT Perusahaan Milik B', $leadB->fresh()->nama_perusahaan);
    }

    /**
     * TC-FIELD: Ownership Field Spoofing Resistance
     */
    public function test_tc_ownership_field_protection_against_spoofing(): void
    {
        $karyawanA = User::factory()->create(['role' => 'karyawan']);
        $karyawanB = User::factory()->create(['role' => 'karyawan']);
        $task = Pekerjaan::factory()->inProgress()->create(['id_pic' => $karyawanA->id_user]);

        $tokenA = $karyawanA->createToken('karyawanA')->plainTextToken;

        // Karyawan A attempts to reassign id_pic to Karyawan B
        $this->withToken($tokenA)->putJson("/api/pekerjaan/{$task->id_pekerjaan}", [
            'id_pic' => $karyawanB->id_user,
            'progress_persen' => 70,
        ]);

        // id_pic remains assigned to Karyawan A
        $this->assertEquals($karyawanA->id_user, $task->fresh()->id_pic);

        // Karyawan A attempts to create reporting under Karyawan B's identity
        $reportRes = $this->withToken($tokenA)->postJson('/api/reporting', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $karyawanB->id_user, // Attempted spoof
            'tgl_lapor' => '2026-09-19',
            'catatan' => 'Laporan dari karyawan A',
        ]);

        $reportRes->assertCreated();
        $this->assertDatabaseHas('reporting', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $karyawanA->id_user, // Must be forced to authenticated user
        ]);
        $this->assertDatabaseMissing('reporting', [
            'id_pekerjaan' => $task->id_pekerjaan,
            'id_user' => $karyawanB->id_user,
        ]);
    }

    /**
     * TC-SHARED: Shared View + Siloed Edit for Sales
     */
    public function test_tc_shared_view_and_siloed_edit_for_sales(): void
    {
        $salesA = User::factory()->create(['role' => 'sales']);
        $salesB = User::factory()->create(['role' => 'sales']);

        $leadA = CalonKlien::factory()->create(['id_user' => $salesA->id_user]);
        $leadB = CalonKlien::factory()->create(['id_user' => $salesB->id_user]);

        $tokenA = $salesA->createToken('salesA')->plainTextToken;

        // Shared View: Sales A sees all leads
        $response = $this->withToken($tokenA)->getJson('/api/calon-klien');
        $response->assertOk()
            ->assertJsonCount(2, 'data');

        // Siloed Edit: Sales A can only mutate lead A, not lead B
        $this->withToken($tokenA)->putJson("/api/calon-klien/{$leadA->id_calon_klien}", [
            'nama_perusahaan' => 'PT A Updated',
        ])->assertOk();

        $this->withToken($tokenA)->putJson("/api/calon-klien/{$leadB->id_calon_klien}", [
            'nama_perusahaan' => 'PT B Attempted Update',
        ])->assertForbidden();
    }

    /**
     * TC-WORKFLOW: Full End-to-End Business Workflow
     * Lead -> Conversion -> Task Assignment -> Submission -> Approval
     */
    public function test_tc_business_workflow_lead_to_approval(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $sales = User::factory()->create(['role' => 'sales']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);

        $adminToken = $admin->createToken('admin')->plainTextToken;
        $salesToken = $sales->createToken('sales')->plainTextToken;
        $karyawanToken = $karyawan->createToken('karyawan')->plainTextToken;
        $pimpinanToken = $pimpinan->createToken('pimpinan')->plainTextToken;

        // Step 1: Sales creates a lead
        $leadRes = $this->withToken($salesToken)->postJson('/api/calon-klien', [
            'id_user' => $sales->id_user,
            'nama_perusahaan' => 'PT Sukses Mandiri',
            'kontak' => '081234567890',
            'email' => 'info@suksesmandiri.com',
            'status_prospek' => 'deal',
            'prioritas' => 'high',
            'nilai_estimasi' => 50000000,
        ]);
        $leadRes->assertCreated();
        $idCalonKlien = $leadRes->json('data.id_calon_klien');

        // Step 2: Sales logs interaction
        $interactionRes = $this->withToken($salesToken)->postJson('/api/lead-interactions', [
            'id_calon_klien' => $idCalonKlien,
            'id_user' => $sales->id_user,
            'tipe_interaksi' => 'meeting',
            'tanggal_interaksi' => '2026-09-19',
            'ringkasan' => 'Kesepakatan kontrak awal dicapai.',
        ]);
        $interactionRes->assertCreated();

        // Step 3: Sales converts deal lead to contract and client
        $convertRes = $this->withToken($salesToken)->postJson("/api/calon-klien/{$idCalonKlien}/convert", [
            'no_kontrak' => 'KTR-PPSA-2026-001',
            'jenis_dokumen' => 'kontrak',
            'tgl_mulai' => '2026-09-19',
            'tgl_selesai' => '2026-12-31',
            'alamat' => 'Gedung Wisma Bisnis Lt. 5, Jakarta',
            'layanan' => 'Implementasi Sistem Informasi Manajemen',
        ]);
        $convertRes->assertOk();
        $idKlien = $convertRes->json('data.kontrak.klien.id_klien');
        $this->assertNotNull($idKlien);

        $this->flushHeaders();
        auth()->forgetGuards();

        // Step 4: Admin creates Template and Task for Karyawan
        $template = TemplateDeadline::create([
            'nama_template' => 'Implementasi Standard',
            'keterangan' => 'Template milestone implementasi',
        ]);

        $taskRes = $this->withToken($adminToken)->postJson('/api/pekerjaan', [
            'id_klien' => $idKlien,
            'id_pic' => $karyawan->id_user,
            'id_template' => $template->id_template,
            'judul' => 'Setup dan Konfigurasi Database',
            'deadline' => '2026-10-15',
            'prioritas' => 'high',
            'progress_persen' => 0,
            'status' => 'in_progress',
        ]);
        $taskRes->assertCreated();
        $idPekerjaan = $taskRes->json('data.id_pekerjaan');

        $this->flushHeaders();
        auth()->forgetGuards();

        // Step 5: Karyawan updates progress & logs reporting
        $this->withToken($karyawanToken)->putJson("/api/pekerjaan/{$idPekerjaan}", [
            'progress_persen' => 80,
            'deskripsi' => 'Skema database selesai dikonfigurasi.',
        ])->assertOk();

        $this->withToken($karyawanToken)->postJson('/api/reporting', [
            'id_pekerjaan' => $idPekerjaan,
            'tgl_lapor' => '2026-09-19',
            'catatan' => 'Migrasi dan verifikasi data selesai.',
            'progress_saat_lapor' => 80,
        ])->assertCreated();

        // Step 6: Karyawan submits task for review
        $submitRes = $this->withToken($karyawanToken)->postJson("/api/pekerjaan/{$idPekerjaan}/submit", [
            'progress_persen' => 100,
        ]);
        $submitRes->assertOk()
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.review_status', 'submitted');

        $this->flushHeaders();
        auth()->forgetGuards();

        // Step 7: Pimpinan approves task
        $approveRes = $this->withToken($pimpinanToken)->postJson("/api/pekerjaan/{$idPekerjaan}/approve", [
            'catatan_review' => 'Hasil pekerjaan diverifikasi sangat baik.',
        ]);
        $approveRes->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.review_status', 'approved')
            ->assertJsonPath('data.approved_by', $pimpinan->id_user);

        // Step 8: Database state verification
        $this->assertDatabaseHas('pekerjaan', [
            'id_pekerjaan' => $idPekerjaan,
            'status' => 'completed',
            'approved_by' => $pimpinan->id_user,
        ]);
    }

    /**
     * TC-APPROVAL: Approval Authorization and Unauthorized Rejection
     */
    public function test_tc_approval_authorization_and_unauthorized_rejection(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $karyawan = User::factory()->create(['role' => 'karyawan']);
        $sales = User::factory()->create(['role' => 'sales']);

        $task = Pekerjaan::factory()->submitted()->create(['id_pic' => $karyawan->id_user]);

        $karyawanToken = $karyawan->createToken('karyawan')->plainTextToken;
        $salesToken = $sales->createToken('sales')->plainTextToken;
        $pimpinanToken = $pimpinan->createToken('pimpinan')->plainTextToken;

        // Karyawan cannot approve (403)
        $this->withToken($karyawanToken)->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
            'catatan_review' => 'Self-approval ilegal',
        ])->assertForbidden();

        $this->flushHeaders();
        auth()->forgetGuards();

        // Sales cannot approve (403)
        $this->withToken($salesToken)->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
            'catatan_review' => 'Sales approval ilegal',
        ])->assertForbidden();

        $this->flushHeaders();
        auth()->forgetGuards();

        // Pimpinan can reject for revision
        $rejectRes = $this->withToken($pimpinanToken)->postJson("/api/pekerjaan/{$task->id_pekerjaan}/reject", [
            'catatan_review' => 'Harap lengkapi dokumentasi uji.',
        ]);
        $rejectRes->assertOk()
            ->assertJsonPath('data.status', 'revision_needed')
            ->assertJsonPath('data.review_status', 'revision_needed');
    }

    /**
     * TC-ACTOR: Server-Side Actor Identity Resolution & Anti-Spoofing
     */
    public function test_tc_actor_identity_anti_spoofing(): void
    {
        $pimpinan = User::factory()->create(['role' => 'pimpinan']);
        $fakeActor = User::factory()->create(['role' => 'pimpinan']);
        $task = Pekerjaan::factory()->submitted()->create();

        $token = $pimpinan->createToken('pimpinan')->plainTextToken;

        // Attempting to spoof approved_by in request body
        $response = $this->withToken($token)->postJson("/api/pekerjaan/{$task->id_pekerjaan}/approve", [
            'approved_by' => $fakeActor->id_user,
            'catatan_review' => 'Approval resmi',
        ]);

        $response->assertOk();

        // approved_by must be strictly resolved to authenticated user $pimpinan
        $this->assertEquals($pimpinan->id_user, $task->fresh()->approved_by);
        $this->assertNotEquals($fakeActor->id_user, $task->fresh()->approved_by);
    }

    /**
     * TC-SPOOF: X-User-Id Spoofing Resistance
     */
    public function test_tc_x_user_id_spoofing_resistance(): void
    {
        $realUser = User::factory()->create(['role' => 'karyawan']);
        $targetUser = User::factory()->create(['role' => 'admin']);

        $token = $realUser->createToken('realUser')->plainTextToken;

        // Sending valid Bearer token of Karyawan alongside spoofed X-User-Id of Admin
        $response = $this->withToken($token)
            ->withHeader('X-User-Id', (string) $targetUser->id_user)
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('user.id_user', $realUser->id_user)
            ->assertJsonPath('user.role', 'karyawan');
        $this->assertNotEquals($targetUser->id_user, $response->json('user.id_user'));

        // Flush headers & guards before unauthenticated request
        $this->flushHeaders();
        auth()->forgetGuards();

        // Sending X-User-Id without Bearer token to protected route must yield 401
        $this->withHeader('X-User-Id', (string) $targetUser->id_user)
            ->getJson('/api/calon-klien')
            ->assertUnauthorized();
    }

    /**
     * TC-STATUS: 401 vs 403 Status Code Distinction
     */
    public function test_tc_401_vs_403_status_code_distinction(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $salesToken = $sales->createToken('sales')->plainTextToken;

        // 401: Missing token
        $this->getJson('/api/calon-klien')->assertUnauthorized();

        // 401: Invalid token
        $this->withToken('invalid-sanctum-token')->getJson('/api/calon-klien')->assertUnauthorized();

        // 403: Authenticated but unauthorized role for endpoint
        $this->withToken($salesToken)->getJson('/api/pekerjaan')->assertForbidden();
    }
}
