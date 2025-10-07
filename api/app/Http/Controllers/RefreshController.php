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

                    // Prepare secure cookie
                    $minutes = 60 * 24 * 30; // 30 days
                    $isProduction = app()->environment('production');
                    $cookie = cookie(
                        'refresh_token',
                        $newRefreshToken,
                        $minutes,
                        '/',
                        null,
                        $isProduction,
                        true,
                        false,
                        $isProduction ? 'None' : 'Lax'
                    );

                    return response()->json([
                        'access_token' => $accessToken,
                        'token_type' => 'Bearer',
                        'user' => $user,
                    ])->withCookie($cookie);
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
}
