<?php
declare(strict_types=1);

// One-time email codes, used for both logging in and verifying a new registration.

const OTP_PURPOSES = ['login', 'register'];

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

function now_sql(int $offsetSeconds = 0): string
{
    return date('Y-m-d H:i:s', time() + $offsetSeconds);
}

/** Refuses with 429 when this email or IP has asked for too many codes recently. */
function otp_enforce_rate_limit(string $email, string $purpose): void
{
    $windowMinutes = (int) config('otp.window_minutes', 15);
    $since = now_sql(-$windowMinutes * 60);

    $byEmail = db()->prepare('SELECT COUNT(*), MIN(created_at) FROM email_verifications WHERE email = ? AND purpose = ? AND created_at >= ?');
    $byEmail->execute([$email, $purpose, $since]);
    [$count, $oldest] = $byEmail->fetch(PDO::FETCH_NUM);

    if ((int) $count >= (int) config('otp.max_per_email', 3)) {
        $minutes = max(1, (int) ceil((strtotime($oldest) + $windowMinutes * 60 - time()) / 60));
        throw new HttpError(429, "Too many codes requested for this email. Please try again in {$minutes} minute" . ($minutes === 1 ? '' : 's') . '.');
    }

    $byIp = db()->prepare('SELECT COUNT(*) FROM email_verifications WHERE ip = ? AND created_at >= ?');
    $byIp->execute([client_ip(), $since]);
    if ((int) $byIp->fetchColumn() >= (int) config('otp.max_per_ip', 10)) {
        throw new HttpError(429, 'Too many codes requested from your network. Please try again later.');
    }
}

/** Creates a code for the email, emails it, and returns the API response. */
function otp_issue(string $email, string $purpose): array
{
    otp_enforce_rate_limit($email, $purpose);

    // Old rows are only needed for rate limiting; drop anything older than a day.
    db()->prepare('DELETE FROM email_verifications WHERE created_at < ?')->execute([now_sql(-86400)]);
    // Requesting a new code cancels any earlier one.
    db()->prepare('UPDATE email_verifications SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL')
        ->execute([now_sql(), $email, $purpose]);

    $minutes = (int) config('otp.ttl_minutes', 5);
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    db()->prepare(
        'INSERT INTO email_verifications (email, purpose, code_hash, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$email, $purpose, password_hash($code, PASSWORD_DEFAULT), client_ip(), now_sql(), now_sql($minutes * 60)]);

    $subject = $purpose === 'login'
        ? 'Your University of Peradeniya Alumni login code'
        : 'Verify your email - University of Peradeniya Alumni';
    $sent = @mail(
        $email,
        $subject,
        "Your code is: {$code}\n\nIt expires in {$minutes} minutes. If you did not request it, you can ignore this email.\n\nAlumni Relations Office, University of Peradeniya",
        'From: ' . config('mail.from')
    );

    $response = ['ok' => true, 'message' => "We sent a 6-digit code to {$email}. It expires in {$minutes} minutes."];
    if (config('debug')) {
        // Development only: lets you log in / register without a working mail server.
        $response['dev_code'] = $code;
    } elseif (!$sent) {
        throw new HttpError(500, 'We could not send the email. Please try again later.');
    }
    return $response;
}

/** Checks a code and marks it used. Throws HttpError when it is wrong, expired or locked. */
function otp_consume(string $email, string $purpose, string $code): void
{
    $stmt = db()->prepare(
        'SELECT * FROM email_verifications WHERE email = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([$email, $purpose]);
    $row = $stmt->fetch();

    if (!$row || strtotime($row['expires_at']) < time()) {
        throw new HttpError(400, 'This code has expired. Please request a new one.');
    }
    if ((int) $row['attempts'] >= (int) config('otp.max_attempts', 5)) {
        throw new HttpError(429, 'Too many incorrect attempts. Please request a new code.');
    }
    if (!preg_match('/^\d{6}$/', $code) || !password_verify($code, $row['code_hash'])) {
        db()->prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
        throw new HttpError(400, 'Incorrect code. Please check your email and try again.');
    }

    db()->prepare('UPDATE email_verifications SET used_at = ? WHERE id = ?')->execute([now_sql(), $row['id']]);
}
