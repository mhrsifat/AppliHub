<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cookie;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\RefreshToken;

class RefreshController extends Controller
{
    protected function cookieForRefresh(string $plainToken, bool $remember): \Symfony\Component\HttpFoundation\Cookie
    {
        $minutes = $remember ? 60 * 24 * 30 : 0;
        $usePartitioned = filter_var(env('PARTITIONED_COOKIES', false), FILTER_VALIDATE_BOOLEAN);

        $sameSite = 'None';
        $secure = request()->isSecure() || app()->environment('production');
        $forceSecure = filter_var(env('FORCE_SECURE_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
        if ($forceSecure) {
            $secure = true;
        }
        if ($sameSite === 'None') {
            $secure = true;
        }

        if ($usePartitioned) {
            return cookie(
                'refresh_token',
                $plainToken,
                $minutes,
                '/',
                null,
                $secure,
                true,
                false,
                $sameSite
            );
        }
        $domain = env('COOKIE_DOMAIN', null);

        return cookie(
            'refresh_token',
            $plainToken,
            $minutes,
            '/',
            $domain,
            $secure,
            true,
            false,
            $sameSite
        );
    }

    protected function clearRefreshCookie(): void
    {
        Cookie::queue(Cookie::forget('refresh_token'));
        $domain = env('COOKIE_DOMAIN', null);
        if ($domain) {
            Cookie::queue(cookie('refresh_token', '', -2628000, '/', $domain));
        }
    }


public function me(Request $request)
{
    // 1) Bearer token check
    $authHeader = $request->header('Authorization');
    if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
        $token = Str::substr($authHeader, 7);
        $pat = PersonalAccessToken::findToken($token);

        if ($pat && $pat->tokenable) {
            $entity = $pat->tokenable;
            // Return role-keyed data at top-level (e.g., 'admin' => {...})
            return response()->json($this->mapUserResponse($entity));
        }
    }

    // 2) Cookie path
    $refreshToken = $request->cookie('refresh_token');
    if (!$refreshToken) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $hashedToken = hash('sha256', $refreshToken);
    $refresh = RefreshToken::where('token', $hashedToken)->valid()->first();

    if (!$refresh) {
        $this->clearRefreshCookie();
        return response()->json(['message' => 'Invalid or expired refresh token'], 401);
    }

    return DB::transaction(function () use ($refresh, $request) {
        $entity = $refresh->tokenable;
        if (! $entity) {
            $refresh->delete();
            $this->clearRefreshCookie();
            return response()->json(['message' => 'Invalid token owner'], 401);
        }

        // rotate access + refresh
        $accessToken = $entity->createToken('auth_token')->plainTextToken;
        $newPlain = bin2hex(random_bytes(40));

        RefreshToken::create([
            'tokenable_id' => $entity->id,
            'tokenable_type' => get_class($entity),
            'token' => hash('sha256', $newPlain),
            'device_name' => $request->userAgent() ?? 'unknown',
            'expires_at' => now()->addDays(30),
        ]);

        // remove old one
        $refresh->delete();

        $cookie = $this->cookieForRefresh($newPlain, true);

        // merge access token data with role-keyed user data so result has no "user" wrapper
        $payload = array_merge(
            ['access_token' => $accessToken, 'token_type' => 'Bearer'],
            $this->mapUserResponse($entity)
        );

        return response()->json($payload)->withCookie($cookie);
    });
}

    protected function mapUserResponse($entity)
    {
        $response = [];

        if ($entity instanceof \Modules\Employee\Models\Employee) {
            $role = $entity->role ?? 'employee';
            $response[$role] = $entity;
        } elseif ($entity instanceof \App\Models\User) {
            $roles = $entity->getRoleNames();
            foreach ($roles as $r) {
                $response[$r] = $entity;
            }
        } else {
            abort(401, 'Unauthorized');
        }

        return $response;
    }
}