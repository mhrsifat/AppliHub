<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MultiAuth
{
    public function handle(Request $request, Closure $next)
    {
       $guards = ['employee', 'sanctum', 'web'];
\Log::info('Auth guards:', $guards);
        foreach ($guards as $guard) {
             \Log::info($guard, ['check' => Auth::guard($guard)->check()]);
            if (Auth::guard($guard)->check()) {
                Auth::shouldUse($guard);
                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}