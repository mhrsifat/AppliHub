<?php

namespace App\Http\Controllers;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Password;

class FortifyController extends Controller
{
    // ----------------------------
    // Helper: generate secure refresh token cookie
    // ----------------------------
    protected function cookieForRefresh(string $plainToken, bool $remember): \Symfony\Component\HttpFoundation\Cookie
    {
        $minutes = $remember ? 60 * 24 * 30 : 60;
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
                true,   // HttpOnly
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
            true,   // HttpOnly
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

    // ----------------------------
    // Helper: create refresh token (polymorphic-aware)
    // ----------------------------
    protected function createRefreshToken($entity, ?string $deviceName): string
    {
        // stronger random
        $plainToken = bin2hex(random_bytes(40));

        RefreshToken::where('tokenable_id', $entity->id)
            ->where('tokenable_type', get_class($entity))
            ->where('device_name', $deviceName ?? 'unknown')
            ->delete();

        RefreshToken::create([
            'tokenable_id' => $entity->id,
            'tokenable_type' => get_class($entity),
            'token' => hash('sha256', $plainToken),
            'device_name' => $deviceName ?? 'unknown',
            'expires_at' => now()->addDays(30),
        ]);

        return $plainToken;
    }

    // ----------------------------
    // Register
    // ----------------------------
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:191',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'remember' => 'sometimes|boolean',
        ]);

        $remember = $request->boolean('remember', false);

        $user = app(CreatesNewUsers::class)->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            "password_confirmation" => $data['password'],
        ]);

        $user->assignRole('user');

        $accessToken = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = $this->createRefreshToken($user, $request->userAgent());

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
        ])->withCookie($this->cookieForRefresh($refreshToken, $remember));
    }

    // ----------------------------
    // Login
    // ----------------------------
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'remember' => 'sometimes|boolean',
        ]);

        $remember = $request->boolean('remember', false);

        // 1) Try employee first
        $employee = \Modules\Employee\Models\Employee::where('email', $data['email'])->first();
        if ($employee && Hash::check($data['password'], $employee->password)) {
            $accessToken = $employee->createToken('auth_token')->plainTextToken;
            $refreshToken = $this->createRefreshToken($employee, $request->userAgent());

            $roles = $employee->getRoleNames();

            $responseData = [
                'message' => 'Login successful',
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
            ];

            if ($roles->contains('admin')) {
                $responseData['admin'] = $employee;
            } elseif ($roles->contains('employee')) {
                $responseData['employee'] = $employee;
            } elseif ($roles->contains('manager')) {
                $responseData['manager'] = $employee;
            }

            return response()->json($responseData)
                ->withCookie($this->cookieForRefresh($refreshToken, $remember));
        }

        // 2) Try users table
        $user = \App\Models\User::where('email', $data['email'])->first();
        if ($user && Hash::check($data['password'], $user->password)) {
            $accessToken = $user->createToken('auth_token')->plainTextToken;
            $refreshToken = $this->createRefreshToken($user, $request->userAgent());

            $roles = $user->getRoleNames();

            $responseData = [
                'message' => 'Login successful',
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
            ];

            if ($roles->contains('admin')) {
                $responseData['admin'] = $user;
            } elseif ($roles->contains('employee')) {
                $responseData['employee'] = $user;
            } else {
                $responseData['user'] = $user;
            }

            return response()->json($responseData)
                ->withCookie($this->cookieForRefresh($refreshToken, $remember));
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    // ----------------------------
    // Logout current device
    // ----------------------------
    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        $plain = $request->cookie('refresh_token');
        if ($plain) {
            $hashed = hash('sha256', $plain);
            $query = RefreshToken::where('token', $hashed);
            // if we have authenticated user, ensure tokenable matches them
            if ($request->user()) {
                $query->where('tokenable_id', $request->user()->id)
                      ->where('tokenable_type', get_class($request->user()));
            }
            $query->delete();
        } else {
            if ($request->user()) {
                RefreshToken::where('tokenable_id', $request->user()->id)
                    ->where('tokenable_type', get_class($request->user()))
                    ->where('device_name', $request->userAgent())
                    ->delete();
            }
        }

        $this->clearRefreshCookie();

        return response()->json(['message' => 'Logged out']);
    }

    // ----------------------------
    // Logout all devices
    // ----------------------------
    public function logoutAll(Request $request)
    {
        if ($request->user()) {
            $request->user()->tokens()->delete();

            RefreshToken::where('tokenable_id', $request->user()->id)
                ->where('tokenable_type', get_class($request->user()))
                ->delete();
        }

        $this->clearRefreshCookie();

        return response()->json(['message' => 'Logged out from all devices']);
    }

    // ----------------------------
    // profile / update / pictures / forgot/reset remain unchanged
    // ----------------------------

    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:191',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
        ]);

        app(UpdatesUserProfileInformation::class)->update(
            $request->user(),
            $request->only(['name', 'email'])
        );

        return response()->json($request->user()->fresh());
    }

    public function updateProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|max:2048',
        ]);

        $path = $request->file('profile_picture')->store('profile_pictures', 'public');

        $user = $request->user();
        $user->profile_picture = $path;
        $user->save();

        return response()->json([
            'message' => 'Profile picture updated',
            'profile_picture_url' => \Illuminate\Support\Facades\Storage::url($path),
        ]);
    }
}