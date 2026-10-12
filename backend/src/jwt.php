<?php
declare(strict_types=1);

// Minimal JSON Web Token (HS256) support, so no Composer package is needed.
// Two kinds of token are issued, told apart by the "purpose" claim:
//   auth     - who is logged in; kept in an httpOnly cookie
//   register - proves an email passed OTP verification; sent with the registration form

const AUTH_COOKIE = 'aro_token';

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    return (string) base64_decode(strtr($data, '-_', '+/'), true);
}

function jwt_encode(array $claims, int $ttlSeconds): string
{
    $now = time();
    $claims += ['iss' => 'aro-alumni', 'iat' => $now, 'exp' => $now + $ttlSeconds];
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($claims));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$payload", config('jwt.secret'), true));
    return "$header.$payload.$signature";
}

/** Returns the claims of a valid, unexpired token with the expected purpose, otherwise null. */
function jwt_decode(string $token, string $purpose): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$header, $payload, $signature] = $parts;

    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", config('jwt.secret'), true));
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    $head = json_decode(base64url_decode($header), true);
    $claims = json_decode(base64url_decode($payload), true);
    if (($head['alg'] ?? null) !== 'HS256' || !is_array($claims)) {
        return null;
    }
    if (($claims['exp'] ?? 0) < time() || ($claims['purpose'] ?? null) !== $purpose) {
        return null;
    }
    return $claims;
}

function set_auth_cookie(string $token, int $expires): void
{
    setcookie(AUTH_COOKIE, $token, [
        'expires'  => $expires,
        'path'     => '/',
        'httponly' => true, // JavaScript can never read the token
        'samesite' => 'Lax', // not sent on cross-site POSTs, which blocks CSRF
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
}

function clear_auth_cookie(): void
{
    set_auth_cookie('', time() - 3600);
}

function issue_auth_token(array $user): void
{
    $ttl = (int) config('jwt.ttl_hours', 168) * 3600;
    $token = jwt_encode(['purpose' => 'auth', 'sub' => (int) $user['id'], 'role' => $user['role']], $ttl);
    set_auth_cookie($token, time() + $ttl);
}
