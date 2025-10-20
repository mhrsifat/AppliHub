<?php

use Illuminate\Container\Attributes\Storage;

if (!function_exists('storage_url')) {
    function storage_url($path)
    {
        return Storage::disk('public')->url($path);
    }
}