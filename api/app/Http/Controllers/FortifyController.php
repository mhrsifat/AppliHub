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
        $minutes = $remember ? 60 * 24 * 30 : 0;
        // Optionally support partitioned cookies (Chromium experimental).
        // When PARTITIONED_COOKIES=true we must NOT send a Domain attribute and
        // must include the Partitioned attribute. Browsers require SameSite=None
        // and Secure for Partitioned cookies.
        $usePartitioned = filter_var(env('PARTITIONED_COOKIES', false), FILTER_VALIDATE_BOOLEAN);

        $sameSite = 'None';

        // Secure when running over HTTPS or in production
        $secure = request()->isSecure() || app()->environment('production');
        // Allow forcing Secure cookies via env for edge cases (e.g. testing).
        $forceSecure = filter_var(env('FORCE_SECURE_COOKIES', false), FILTER_VALIDATE_BOOLEAN);
        if ($forceSecure) {
            $secure = true;
        }

        // Browsers require cookies that use SameSite=None to also be Secure.
        if ($sameSite === 'None') {
            $secure = true;
        }

        if ($usePartitioned) {
            // Return a Symfony cookie WITHOUT a Domain so it can be marked Partitioned.
            // We'll craft a raw header for Partitioned in places that need it.
            return cookie(
                'refresh_token',
                $plainToken,
                $minutes,
                '/',
                null,   // no domain for partitioned
                $secure,
                true,   // HttpOnly
                false,
                $sameSite
            );
        }

        // Default behavior: domain-based SameSite=None cookie. Put the top-level
        // domain for cookies into .env: COOKIE_DOMAIN=.example.com
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

    // ----------------------------
    // Helper: create refresh token
    // ----------------------------
    protected function createRefreshToken($user, ?string $deviceName): string
{
    $plainToken = Str::random(60);

    RefreshToken::where('user_id', $user->id)
        ->where('device_name', $deviceName ?? 'unknown')
        ->delete();

    RefreshToken::create([
        'user_id' => $user->id,
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
        // 1️⃣ Validate request
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

    // 1️⃣ Try employee first
    $employee = \Modules\Employee\Models\Employee::where('email', $data['email'])->first();
    if ($employee && \Illuminate\Support\Facades\Hash::check($data['password'], $employee->password)) {
        $accessToken = $employee->createToken('employee_token')->plainTextToken;
        $refreshToken = $this->createRefreshToken($employee, $request->userAgent());

        return response()->json([
            'message' => 'Login successful',
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'employee' => $employee,
        ])->withCookie($this->cookieForRefresh($refreshToken, $remember));
    }

    // 2️⃣ Try admin (users table)
    $user = \App\Models\User::where('email', $data['email'])->first();
    if ($user && \Illuminate\Support\Facades\Hash::check($data['password'], $user->password)) {
        $accessToken = $user->createToken('admin_token')->plainTextToken;
        $refreshToken = $this->createRefreshToken($user, $request->userAgent());

        return response()->json([
            'message' => 'Login successful',
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'admin' => $user,
        ])->withCookie($this->cookieForRefresh($refreshToken, $remember));
    }

    // 3️⃣ Not found anywhere
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
            RefreshToken::where('token', $hashed)
                ->where('user_id', optional($request->user())->id)
                ->delete();
        } else {
            RefreshToken::where('user_id', optional($request->user())->id)
                ->where('device_name', $request->userAgent())
                ->delete();
        }

        // Clear both host (partitioned) and domain cookies
        Cookie::queue(Cookie::forget('refresh_token'));
        $domain = env('COOKIE_DOMAIN', null);
        if ($domain) {
            Cookie::queue(cookie('refresh_token', '', -2628000, '/', $domain));
        }

        return response()->json(['message' => 'Logged out']);
    }

    // ----------------------------
    // Logout all devices
    // ----------------------------
    public function logoutAll(Request $request)
    {
        if ($request->user()) {
            $request->user()->tokens()->delete();
            RefreshToken::where('user_id', $request->user()->id)->delete();
        }

        // Clear both host (partitioned) and domain cookies
        Cookie::queue(Cookie::forget('refresh_token'));
        $domain = env('COOKIE_DOMAIN', null);
        if ($domain) {
            Cookie::queue(cookie('refresh_token', '', -2628000, '/', $domain));
        }

        return response()->json(['message' => 'Logged out from all devices']);
    }

    // ----------------------------
    // Get profile
    // ----------------------------
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    // ----------------------------
    // Update profile
    // ----------------------------
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

    // ----------------------------
    // Update profile picture
    // ----------------------------
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

    // ----------------------------
    // Refresh token (rotation)
    // ----------------------------
   
    public function refreshToken(Request $request)
{
    $plain = $request->cookie('refresh_token');

    if (!$plain) {
        return response()->json(['message' => 'Refresh token required'], 401);
    }

    $hashed = hash('sha256', $plain);

    $refresh = RefreshToken::where('token', $hashed)
        ->valid()
        ->first();

    if (!$refresh || !hash_equals($refresh->token, $hashed)) {
        Cookie::queue(Cookie::forget('refresh_token'));
        return response()->json(['message' => 'Invalid or expired refresh token'], 401);
    }

    $entity = $refresh->user; // could be employee or admin

    // Rotate refresh token
    $refresh->delete();
    $accessToken = $entity->createToken('auth_token')->plainTextToken;
    $newRefreshToken = $this->createRefreshToken($entity, $request->userAgent());

    // Distinguish by table
    $responseData = [
        'access_token' => $accessToken,
        'token_type' => 'Bearer',
    ];

    if ($entity instanceof \Modules\Employee\Models\Employee) {
        $responseData['employee'] = $entity;
    } elseif ($entity instanceof \App\Models\User) {
        $responseData['admin'] = $entity;
    }

    return response()->json($responseData)
        ->withCookie($this->cookieForRefresh($newRefreshToken, true));
}


    // ----------------------------
    // Forgot password
    // ----------------------------
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        return response()->json(
            ['message' => __($status)],
            $status === Password::RESET_LINK_SENT ? 200 : 400
        );
    }

    // ----------------------------
    // Reset password
    // ----------------------------
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        return response()->json(
            ['message' => __($status)],
            $status === Password::PASSWORD_RESET ? 200 : 400
        );
    }
}
