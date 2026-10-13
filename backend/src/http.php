<?php
declare(strict_types=1);

/** Thrown by handlers to return an error response with a status code. */
class HttpError extends Exception
{
    public int $status;
    public array $fields;

    public function __construct(int $status, string $message, array $fields = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->fields = $fields;
    }
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Request body: JSON for application/json requests, otherwise regular form fields. */
function input(): array
{
    static $data = null;
    if ($data !== null) {
        return $data;
    }
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $decoded = json_decode(file_get_contents('php://input') ?: '', true);
        $data = is_array($decoded) ? $decoded : [];
    } else {
        $data = $_POST;
    }
    return $data;
}

function str_input(string $key, int $maxLength = 255): string
{
    $value = input()[$key] ?? '';
    if (!is_scalar($value)) {
        return '';
    }
    return mb_substr(trim((string) $value), 0, $maxLength);
}

function bool_input(string $key): bool
{
    $value = input()[$key] ?? false;
    return in_array($value, [true, 1, '1', 'true', 'on', 'yes'], true);
}

/** Keeps only the allowed values from an array input such as checkbox groups. */
function set_input(string $key, array $allowed): array
{
    $value = input()[$key] ?? [];
    if (is_string($value)) {
        $value = $value === '' ? [] : explode(',', $value);
    }
    if (!is_array($value)) {
        return [];
    }
    return array_values(array_intersect($allowed, $value));
}

/**
 * The logged-in user, from the JWT in the auth cookie. The account is re-read from the
 * database on every request, so an alumnus whose verification is withdrawn is logged out
 * straight away even though their token has not expired yet.
 */
function current_user(): ?array
{
    static $resolved = false, $user = null;
    if ($resolved) {
        return $user;
    }
    $resolved = true;

    $token = $_COOKIE[AUTH_COOKIE] ?? '';
    $claims = $token !== '' ? jwt_decode($token, 'auth') : null;
    $found = $claims ? find_user((int) $claims['sub']) : null;
    if ($found && user_can_log_in($found)) {
        $user = $found;
    } elseif ($token !== '') {
        clear_auth_cookie();
    }
    return $user;
}

function current_user_id(): ?int
{
    $user = current_user();
    return $user ? (int) $user['id'] : null;
}

function require_login(): int
{
    $id = current_user_id();
    if ($id === null) {
        throw new HttpError(401, 'Please log in to continue.');
    }
    return $id;
}

function send_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, config('cors_origins', []), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Vary: Origin');
    }
}
