<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'broadcasting/auth', 'broadcasting/auth/*', 'sanctum/csrf-cookie', 'login', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:5173', "https://test.mhrsifat.xyz", "http://test.mhrsifat.xyz", "https://appli-hub-git-test-mhrsifat-s-projects.vercel.app", "http://appli-hub.vercel.app", "https://appli-hub.vercel.app", "https://applihub-test.vercel.app", "http://applihub-test.vercel.app", "https://applihub.mhrsifat.xyz", "http://applihub.mhrsifat.xyz"],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    'supports_credentials' => true,

];
