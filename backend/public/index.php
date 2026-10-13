<?php
declare(strict_types=1);

// Single entry point for the API. Every request under /api is routed here,
// either by .htaccess (Apache / XAMPP) or by `php -S ... public/index.php`.

require __DIR__ . '/../src/bootstrap.php';

send_cors_headers();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Accept both /api/events and /some/sub/folder/api/events.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$apiPos = strpos($path, '/api/');
if ($apiPos !== false) {
    $path = substr($path, $apiPos + 4);
}
$path = '/' . trim($path, '/');

$router = require __DIR__ . '/../src/routes.php';
$router->dispatch($_SERVER['REQUEST_METHOD'], $path);
