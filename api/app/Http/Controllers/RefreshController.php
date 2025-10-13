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
    // filepath: app/Http/Controllers/RefreshController.php

    public function me(Request $request)
{
    // ------------------------
    // 1) Check Authorization header (Bearer token)
    // ------------------------
    $authHeader = $request->header('Authorization');
    if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
        $token = Str::substr($authHeader, 7);
        $pat = PersonalAccessToken::findToken($token);

        if ($pat && $pat->tokenable) {
            $entity = $pat->tokenable;

            $responseData = [];
            if ($entity instanceof \Modules\Employee\Models\Employee) {
                $responseData['employee'] = $entity;
            } elseif ($entity instanceof \App\Models\User) {
                $responseData['admin'] = $entity;
            } else {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            return response()->json(['user' => $responseData]);
        }
    }

    // ------------------------
    // 2) Check refresh_token cookie
    // ------------------------
    $refreshToken = $request->cookie('refresh_token');
    if (!$refreshToken) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $hashedToken = hash('sha256', $refreshToken);
    $refresh = RefreshToken::where('token', $hashedToken)->valid()->first();

    if (!$refresh) {
        $domain = env('COOKIE_DOMAIN', null);
        Cookie::queue(Cookie::forget('refresh_token'));
        if ($domain) {
            Cookie::queue(cookie('refresh_token', '', -2628000, '/', $domain));
        }
        return response()->json(['message' => 'Invalid or expired refresh token'], 401);
    }

    return DB::transaction(function () use ($refresh, $request) {
        $userEntity = $refresh->user;

        $accessToken = $userEntity->createToken('auth_token')->plainTextToken;
        $newRefreshToken = Str::random(60);
        $newHashed = hash('sha256', $newRefreshToken);

        RefreshToken::create([
            'user_id' => $userEntity->id,
            'token' => $newHashed,
            'device_name' => $request->userAgent() ?? 'unknown',
            'expires_at' => now()->addDays(30),
        ]);
        $refresh->delete();

        $responseData = [];
        if ($userEntity instanceof \Modules\Employee\Models\Employee) {
            $responseData['employee'] = $userEntity;
        } elseif ($userEntity instanceof \App\Models\User) {
            $responseData['admin'] = $userEntity;
        } else {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $usePartitioned = filter_var(env('PARTITIONED_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
        $maxAge = 60 * 60 * 24 * 30;
        $cookieValue = rawurlencode($newRefreshToken);

        if ($usePartitioned) {
            $secure = request()->isSecure() || app()->environment('production');
            $forceSecure = filter_var(env('FORCE_SECURE_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
            if ($forceSecure) $secure = true;
            $secure = true;

            $securePart = $secure ? 'Secure; ' : '';

            $cookieHeader = sprintf(
                'refresh_token=%s; Path=/; Max-Age=%d; HttpOnly; %sSameSite=None; Partitioned',
                $cookieValue,
                $maxAge,
                $securePart
            );

            return response()->json([
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
                'user' => $responseData,
            ])->header('Set-Cookie', $cookieHeader);
        }

        $cookie = $this->cookieForRefresh($newRefreshToken, true);

        return response()->json([
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'user' => $responseData,
        ])->withCookie($cookie);
    });
}

    protected function cookieForRefresh(string $plainToken, bool $remember): \Symfony\Component\HttpFoundation\Cookie
    {
        $minutes = $remember ? 60 * 24 * 30 : 0;

        // Put the top-level domain for cookies into .env:
        // COOKIE_DOMAIN=.mhrsifat.xyz
        $domain = env('COOKIE_DOMAIN', null); // e.g. ".mhrsifat.xyz"

        // Ensure cookie is Secure when using SameSite=None (required by browsers)
        $secure = request()->isSecure() || app()->environment('production');
        $forceSecure = filter_var(env('FORCE_SECURE_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
        if ($forceSecure) {
            $secure = true;
        }

        // Cross-site refresh cookie must be SameSite=None
        $sameSite = 'None';
        if ($sameSite === 'None') {
            $secure = true;
        }

        return cookie(
            'refresh_token',
            $plainToken,
            $minutes,
            '/',       // path
            $domain,   // domain
            $secure,   // secure
            true,      // httpOnly
            false,     // raw
            $sameSite  // sameSite
        );
    }
}
