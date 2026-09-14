<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportingRequest;
use App\Http\Requests\UpdateReportingRequest;
use App\Http\Resources\ReportingResource;
use App\Models\Reporting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ReportingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $reporting = Reporting::query()
            ->with('pekerjaan')
            ->orderByDesc('id_reporting')
            ->get();

        return ReportingResource::collection($reporting);
    }

    public function store(StoreReportingRequest $request): JsonResponse
    {
        $reporting = Reporting::create($request->validated())
            ->load('pekerjaan');

        return (new ReportingResource($reporting))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Reporting $reporting): ReportingResource
    {
        return new ReportingResource($reporting->load('pekerjaan'));
    }

    public function update(UpdateReportingRequest $request, Reporting $reporting): ReportingResource
    {
        $reporting->update($request->validated());

        return new ReportingResource($reporting->load('pekerjaan'));
    }

    public function destroy(Reporting $reporting): Response
    {
        $reporting->delete();

        return response()->noContent();
    }
}
