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
    // in the API response so login/registration work without a mail server.
    // MUST be false in production.
    'debug' => true,

    // Origins allowed to call the API from a browser (only needed when the
    // React app is served from a different origin than the API).
    'cors_origins' => ['http://localhost:5173'],

    'jwt' => [
        // Signs login tokens. Use a long random value and keep it secret, e.g. the output of
        //   php -r "echo bin2hex(random_bytes(32));"
        // Changing it logs everybody out.
        'secret'                 => 'CHANGE-ME-to-a-long-random-string',
        'ttl_hours'              => 168, // how long a login lasts (7 days)
        'registration_ttl_minutes' => 30,  // time to finish the form after verifying the email
    ],

    // Student Login accepts only these email domains and their subdomains,
    // so 'pdn.ac.lk' allows @pdn.ac.lk, @sci.pdn.ac.lk, @eng.pdn.ac.lk, ...
    'student_email_domains' => ['pdn.ac.lk'],

    'mail' => [
        'from' => 'aro@pdn.ac.lk',
    ],

    'otp' => [
        'ttl_minutes'       => 5,  // a code is valid for 5 minutes
        'max_attempts'      => 5,  // wrong guesses allowed per code
        'window_minutes'    => 15, // rate-limit window
        'max_per_email'     => 3,  // codes per email address per window
        'max_per_ip'        => 10, // codes per IP address per window (stops mass emailing)
    ],

    'uploads' => [
        // Stored outside the public folder so certificates are never directly downloadable.
        'dir'       => __DIR__ . '/../storage/uploads',
        'max_bytes' => 5 * 1024 * 1024,
    ],
];
