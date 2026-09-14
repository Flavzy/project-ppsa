<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateDeadlineRequest;
use App\Http\Requests\UpdateTemplateDeadlineRequest;
use App\Http\Resources\TemplateDeadlineResource;
use App\Models\TemplateDeadline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TemplateDeadlineController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $templateDeadline = TemplateDeadline::query()
            ->orderByDesc('id_template')
            ->get();

        return TemplateDeadlineResource::collection($templateDeadline);
    }

    public function store(StoreTemplateDeadlineRequest $request): JsonResponse
    {
        $templateDeadline = TemplateDeadline::create($request->validated());

        return (new TemplateDeadlineResource($templateDeadline))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(TemplateDeadline $templateDeadline): TemplateDeadlineResource
    {
        return new TemplateDeadlineResource($templateDeadline);
    }

    public function update(UpdateTemplateDeadlineRequest $request, TemplateDeadline $templateDeadline): TemplateDeadlineResource
    {
        $templateDeadline->update($request->validated());

        return new TemplateDeadlineResource($templateDeadline);
    }

    public function destroy(TemplateDeadline $templateDeadline): Response
    {
        $templateDeadline->delete();

        return response()->noContent();
    }
}
