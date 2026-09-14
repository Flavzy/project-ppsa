<?php

use App\Http\Controllers\Api\CalonKlienController;
use App\Http\Controllers\Api\KlienController;
use App\Http\Controllers\Api\KontrakController;
use App\Http\Controllers\Api\PekerjaanController;
use App\Http\Controllers\Api\ReportingController;
use App\Http\Controllers\Api\TemplateDeadlineController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('users', [UserController::class, 'index'])->name('users.index');

Route::apiResource('calon-klien', CalonKlienController::class)->parameters([
    'calon-klien' => 'calonKlien',
]);
Route::apiResource('kontrak', KontrakController::class);
Route::apiResource('klien', KlienController::class);
Route::apiResource('template-deadline', TemplateDeadlineController::class)->parameters([
    'template-deadline' => 'templateDeadline',
]);
Route::apiResource('pekerjaan', PekerjaanController::class);
Route::apiResource('reporting', ReportingController::class);
