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
                return response()->json(['user' => $pat->tokenable]);
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
            // Invalid or expired refresh token → clear cookie
            $domain = env('COOKIE_DOMAIN', null);
            Cookie::queue(Cookie::forget('refresh_token'));
            if ($domain) {
                Cookie::queue(cookie('refresh_token', '', -2628000, '/', $domain));
            }
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        return DB::transaction(function () use ($refresh, $request) {
            $user = $refresh->user;

            // Create new tokens
            $accessToken = $user->createToken('auth_token')->plainTextToken;
            $newRefreshToken = Str::random(60);
            $newHashed = hash('sha256', $newRefreshToken);

            // Store and delete
            RefreshToken::create([
                'user_id' => $user->id,
                'token' => $newHashed,
                'device_name' => $request->userAgent() ?? 'unknown',
                'expires_at' => now()->addDays(30),
            ]);
            $refresh->delete();

            // ------------------------
            // Handle Partitioned or Standard cookie
            // ------------------------
            $usePartitioned = filter_var(env('PARTITIONED_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
            $maxAge = 60 * 60 * 24 * 30;
            $cookieValue = rawurlencode($newRefreshToken);

            $responseData = [
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
                'user' => $user,
            ];

            if ($usePartitioned) {
                // Chrome 118+ partitioned cookie
                $secure = request()->isSecure() || app()->environment('production');
                $forceSecure = filter_var(env('FORCE_SECURE_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
                if ($forceSecure) $secure = true;
                // SameSite=None requires Secure
                $secure = true;

                $securePart = $secure ? 'Secure; ' : '';

                $cookieHeader = sprintf(
                    'refresh_token=%s; Path=/; Max-Age=%d; HttpOnly; %sSameSite=None; Partitioned',
                    $cookieValue,
                    $maxAge,
                    $securePart
                );

                return response()
                    ->json($responseData)
                    ->header('Set-Cookie', $cookieHeader);
            }

            // Fallback: domain-based cookie (legacy browsers)
            $cookie = $this->cookieForRefresh($newRefreshToken, true);
            return response()
                ->json($responseData)
                ->withCookie($cookie);
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
