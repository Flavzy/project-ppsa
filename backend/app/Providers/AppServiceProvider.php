<?php

namespace App\Providers;

use App\Models\CalonKlien;
use App\Models\Klien;
use App\Models\Kontrak;
use App\Models\LeadInteraction;
use App\Models\Pekerjaan;
use App\Models\PerformanceReview;
use App\Models\Reporting;
use App\Policies\CalonKlienPolicy;
use App\Policies\KlienPolicy;
use App\Policies\KontrakPolicy;
use App\Policies\LeadInteractionPolicy;
use App\Policies\PekerjaanPolicy;
use App\Policies\PerformanceReviewPolicy;
use App\Policies\ReportingPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(CalonKlien::class, CalonKlienPolicy::class);
        Gate::policy(LeadInteraction::class, LeadInteractionPolicy::class);
        Gate::policy(Kontrak::class, KontrakPolicy::class);
        Gate::policy(Klien::class, KlienPolicy::class);
        Gate::policy(Pekerjaan::class, PekerjaanPolicy::class);
        Gate::policy(Reporting::class, ReportingPolicy::class);
        Gate::policy(PerformanceReview::class, PerformanceReviewPolicy::class);
    }
}
