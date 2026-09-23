<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $users = User::query()
            ->orderBy('nama')
            ->orderBy('id_user')
            ->get();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::create($data);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): Response|JsonResponse
    {
        if ((int) $request->user()->id_user === (int) $user->id_user) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($user->calonKlien()->exists() || $user->pekerjaan()->exists() || $user->leadInteractions()->exists()) {
            return response()->json([
                'message' => 'Akun tidak dapat dihapus karena masih terhubung dengan data Calon Klien, Tugas Pekerjaan, atau Riwayat Interaksi. Ubah penugasan PIC terlebih dahulu.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->delete();

        return response()->noContent();
    }
}
