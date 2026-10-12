<?php
// Copy this file to config.php and fill in your own values.
// config.php is git-ignored so real credentials never get committed.

return [
    'db' => [
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'name'     => 'aro_alumni',
        'user'     => 'root',
        'password' => '',
    ],

    // true while developing: shows PHP error details and returns the email OTP
    // in the API response so registration works without a mail server.
    // MUST be false in production.
    'debug' => true,

    // Origins allowed to call the API from a browser (only needed when the
    // React app is served from a different origin than the API).
    'cors_origins' => ['http://localhost:5173'],

    'mail' => [
        'from' => 'aro@pdn.ac.lk',
    ],

    'otp' => [
        'ttl_minutes'     => 10,
        'max_attempts'    => 5,
        'resend_seconds'  => 60,
    ],

    'uploads' => [
        // Stored outside the public folder so certificates are never directly downloadable.
        'dir'       => __DIR__ . '/../storage/uploads',
        'max_bytes' => 5 * 1024 * 1024,
    ],
];
