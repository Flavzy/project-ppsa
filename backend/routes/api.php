<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CalonKlienController;
use App\Http\Controllers\Api\DashboardSummaryController;
use App\Http\Controllers\Api\KlienController;
use App\Http\Controllers\Api\KontrakController;
use App\Http\Controllers\Api\LeadConversionController;
use App\Http\Controllers\Api\PekerjaanController;
use App\Http\Controllers\Api\PekerjaanWorkflowController;
use App\Http\Controllers\Api\PerformanceReviewController;
use App\Http\Controllers\Api\ReportingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])->name('login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->middleware('role:admin,pimpinan')->name('users.store');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('role:admin,pimpinan')->name('users.show');
    Route::match(['put', 'patch'], 'users/{user}', [UserController::class, 'update'])->middleware('role:admin,pimpinan')->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('role:admin,pimpinan')->name('users.destroy');

    Route::get('dashboard-summary', DashboardSummaryController::class)->name('dashboard-summary');

    // Calon Klien & Conversion
    Route::post('calon-klien/{calonKlien}/convert', [LeadConversionController::class, 'store'])
        ->middleware('role:admin,pimpinan,operator,sales')
        ->name('calon-klien.convert');
    Route::delete('calon-klien/{calonKlien}', [CalonKlienController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')
        ->name('calon-klien.destroy');
    Route::apiResource('calon-klien', CalonKlienController::class)
        ->except(['destroy'])
        ->parameters(['calon-klien' => 'calonKlien'])
        ->middleware('role:admin,pimpinan,operator,sales');

    // Kontrak
    Route::delete('kontrak/{kontrak}', [KontrakController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')
        ->name('kontrak.destroy');
    Route::apiResource('kontrak', KontrakController::class)
        ->except(['destroy'])
        ->middleware('role:admin,pimpinan,operator,sales');

    // Klien
    Route::delete('klien/{klien}', [KlienController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')
        ->name('klien.destroy');
    Route::apiResource('klien', KlienController::class)
        ->except(['destroy'])
        ->middleware('role:admin,pimpinan,operator,sales,karyawan');

    // Pekerjaan Workflow
    Route::post('pekerjaan/{pekerjaan}/start', [PekerjaanWorkflowController::class, 'start'])
        ->middleware('role:admin,karyawan,pimpinan')
        ->name('pekerjaan.start');
    Route::post('pekerjaan/{pekerjaan}/submit', [PekerjaanWorkflowController::class, 'submit'])
        ->middleware('role:admin,karyawan,pimpinan')
        ->name('pekerjaan.submit');
    Route::post('pekerjaan/{pekerjaan}/approve', [PekerjaanWorkflowController::class, 'approve'])
        ->middleware('role:admin,pimpinan')
        ->name('pekerjaan.approve');
    Route::post('pekerjaan/{pekerjaan}/reject', [PekerjaanWorkflowController::class, 'reject'])
        ->middleware('role:admin,pimpinan')
        ->name('pekerjaan.reject');

    // Pekerjaan:
    // store accessible to admin,pimpinan,operator (to assign client PIC)
    // destroy restricted to admin,pimpinan
    // index, show, update accessible to admin,pimpinan,karyawan,operator
    Route::post('pekerjaan', [PekerjaanController::class, 'store'])
        ->middleware('role:admin,pimpinan,operator')->name('pekerjaan.store');
    Route::delete('pekerjaan/{pekerjaan}', [PekerjaanController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')->name('pekerjaan.destroy');
    Route::get('pekerjaan', [PekerjaanController::class, 'index'])
        ->middleware('role:admin,pimpinan,karyawan,operator')->name('pekerjaan.index');
    Route::get('pekerjaan/{pekerjaan}', [PekerjaanController::class, 'show'])
        ->middleware('role:admin,pimpinan,karyawan,operator')->name('pekerjaan.show');
    Route::match(['put', 'patch'], 'pekerjaan/{pekerjaan}', [PekerjaanController::class, 'update'])
        ->middleware('role:admin,pimpinan,karyawan,operator')->name('pekerjaan.update');

    // Reporting:
    // destroy restricted to admin,pimpinan
    // index, store, show, update for admin,karyawan,pimpinan
    Route::delete('reporting/{reporting}', [ReportingController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')->name('reporting.destroy');
    Route::apiResource('reporting', ReportingController::class)
        ->except(['destroy'])
        ->middleware('role:admin,karyawan,pimpinan');

    // Performance Reviews:
    // store, update, destroy restricted to admin,pimpinan
    // index, show accessible to admin,karyawan,pimpinan
    Route::post('performance-reviews', [PerformanceReviewController::class, 'store'])
        ->middleware('role:admin,pimpinan')->name('performance-reviews.store');
    Route::match(['put', 'patch'], 'performance-reviews/{performanceReview}', [PerformanceReviewController::class, 'update'])
        ->middleware('role:admin,pimpinan')->name('performance-reviews.update');
    Route::delete('performance-reviews/{performanceReview}', [PerformanceReviewController::class, 'destroy'])
        ->middleware('role:admin,pimpinan')->name('performance-reviews.destroy');
    Route::get('performance-reviews', [PerformanceReviewController::class, 'index'])
        ->middleware('role:admin,karyawan,pimpinan')->name('performance-reviews.index');
    Route::get('performance-reviews/{performanceReview}', [PerformanceReviewController::class, 'show'])
        ->middleware('role:admin,karyawan,pimpinan')->name('performance-reviews.show');
});
