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
        if ($refreshToken) {
            $hashedToken = hash('sha256', $refreshToken);

            $refresh = RefreshToken::where('token', $hashedToken)
                ->valid()
                ->first();

            if ($refresh) {
                return DB::transaction(function () use ($refresh, $request) {
                    $user = $refresh->user;

                    // Issue new access token
                    $accessToken = $user->createToken('auth_token')->plainTextToken;

                    // Generate new refresh token
                    $newRefreshToken = Str::random(60);
                    $newHashed = hash('sha256', $newRefreshToken);

                    // Store new refresh token
                    RefreshToken::create([
                        'user_id' => $user->id,
                        'token' => $newHashed,
                        'device_name' => $request->userAgent() ?? 'unknown',
                        'expires_at' => now()->addDays(30),
                    ]);

                    // Delete old refresh token
                    $refresh->delete();

                    // ------------------------
                    // Prepare secure cookie using helper to keep behavior consistent
                    // ------------------------
                    $domain = env('COOKIE_DOMAIN', '.mhrsifat.xyz'); // or null if you want host-only
                    $maxAge = 60 * 60 * 24 * 30; // seconds
                    $cookieValue = rawurlencode($newRefreshToken);

                    // Partitioned cookie (Chromium); SameSite=None and Secure required
                    $cookieHeader = sprintf(
                        'refresh_token=%s; Path=/; Domain=%s; Max-Age=%d; HttpOnly; Secure; SameSite=None; Partitioned',
                        $cookieValue,
                        $domain,
                        $maxAge
                    );

                    // return response WITHOUT withCookie()
                    return response()->json([
                        'access_token' => $accessToken,
                        'token_type' => 'Bearer',
                        'user' => $user,
                    ])->header('Set-Cookie', $cookieHeader);
                });
            }

            // Invalid or expired refresh token -> clear cookie
            Cookie::queue(Cookie::forget('refresh_token'));
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        // ------------------------
        // 3) No valid auth found
        // ------------------------
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    protected function cookieForRefresh(string $plainToken, bool $remember): \Symfony\Component\HttpFoundation\Cookie
    {
        $minutes = $remember ? 60 * 24 * 30 : 0;

        // Put the top-level domain for cookies into .env:
        // COOKIE_DOMAIN=.mhrsifat.xyz
        $domain = env('COOKIE_DOMAIN', null); // e.g. ".mhrsifat.xyz"

        // Ensure cookie is Secure when using SameSite=None (required by browsers)
        $secure = request()->isSecure() || app()->environment('production');

        // Cross-site refresh cookie must be SameSite=None
        $sameSite = 'None';

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
