<?php
declare(strict_types=1);

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function email_is_registered(string $email): bool
{
    $stmt = db()->prepare('SELECT 1 FROM users WHERE email = ?');
    $stmt->execute([$email]);
    return (bool) $stmt->fetchColumn();
}

function log_in_user(int $userId): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
}

// GET /auth/me
function handle_me(): array
{
    $id = current_user_id();
    $user = $id !== null ? find_user($id) : null;
    if ($id !== null && $user === null) {
        // Account was deleted while the session was alive.
        unset($_SESSION['user_id']);
    }
    return ['user' => $user ? user_payload($user) : null];
}

// POST /auth/login  { email, password, role }
function handle_login(): array
{
    $email = normalize_email(str_input('email', 190));
    $password = password_input('password');
    $role = str_input('role', 20);

    if ($email === '' || $password === '') {
        throw new HttpError(422, 'Enter your email and password.');
    }

    $stmt = db()->prepare('SELECT id, role, password_hash FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        throw new HttpError(401, 'Incorrect email or password.');
    }
    if (in_array($role, ['alumni', 'student'], true) && $row['role'] !== $role && $row['role'] !== 'admin') {
        $correct = $row['role'] === 'student' ? 'Student Login' : 'Alumni Login';
        throw new HttpError(403, "This account is registered as {$row['role']}. Please use {$correct}.");
    }

    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    }

    log_in_user((int) $row['id']);
    return ['user' => user_payload(find_user((int) $row['id']))];
}

// POST /auth/logout
function handle_logout(): array
{
    $_SESSION = [];
    session_regenerate_id(true);
    return ['ok' => true];
}

// POST /auth/otp/send  { email }
function handle_send_otp(): array
{
    $email = normalize_email(str_input('email', 190));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new HttpError(422, 'Enter a valid email address.', ['email' => 'Enter a valid email address.']);
    }
    if (email_is_registered($email)) {
        throw new HttpError(409, 'This email is already registered. Please log in instead.', ['email' => 'Already registered.']);
    }

    $ttl = (int) config('otp.ttl_minutes', 10) * 60;
    $resend = (int) config('otp.resend_seconds', 60);

    $stmt = db()->prepare('SELECT expires_at FROM email_verifications WHERE email = ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email]);
    $last = $stmt->fetchColumn();
    if ($last) {
        $wait = strtotime($last) - $ttl + $resend - time();
        if ($wait > 0) {
            throw new HttpError(429, "Please wait {$wait} seconds before requesting another code.");
        }
    }

    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    db()->prepare('DELETE FROM email_verifications WHERE email = ?')->execute([$email]);
    db()->prepare('INSERT INTO email_verifications (email, code_hash, expires_at) VALUES (?, ?, ?)')
        ->execute([$email, password_hash($code, PASSWORD_DEFAULT), date('Y-m-d H:i:s', time() + $ttl)]);

    $minutes = (int) config('otp.ttl_minutes', 10);
    $sent = @mail(
        $email,
        'Your University of Peradeniya Alumni verification code',
        "Your verification code is: {$code}\n\nIt expires in {$minutes} minutes.\n\nAlumni Relations Office, University of Peradeniya",
        'From: ' . config('mail.from')
    );

    $response = ['ok' => true, 'message' => "We sent a 6-digit code to {$email}."];
    if (config('debug')) {
        // Development only: lets you register without a working mail server.
        $response['dev_code'] = $code;
    } elseif (!$sent) {
        throw new HttpError(500, 'We could not send the verification email. Please try again later.');
    }
    return $response;
}

// POST /auth/otp/verify  { email, code }
function handle_verify_otp(): array
{
    $email = normalize_email(str_input('email', 190));
    $code = preg_replace('/\D/', '', str_input('code', 10));

    $stmt = db()->prepare('SELECT * FROM email_verifications WHERE email = ? ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || strtotime($row['expires_at']) < time()) {
        throw new HttpError(400, 'This code has expired. Please request a new one.');
    }
    if ((int) $row['attempts'] >= (int) config('otp.max_attempts', 5)) {
        throw new HttpError(429, 'Too many incorrect attempts. Please request a new code.');
    }
    if (!password_verify($code, $row['code_hash'])) {
        db()->prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
        throw new HttpError(400, 'Incorrect code. Please check your email and try again.');
    }

    db()->prepare('DELETE FROM email_verifications WHERE email = ?')->execute([$email]);
    $_SESSION['verified_email'] = $email;
    return ['ok' => true, 'verified' => true];
}

/** Validates and stores an uploaded degree certificate. Returns the stored file name. */
function store_degree_certificate(array $file): string
{
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new HttpError(422, 'Could not upload your certificate.', ['degree_cert' => 'Upload failed. Please try again.']);
    }
    if ($file['size'] > (int) config('uploads.max_bytes')) {
        throw new HttpError(422, 'Certificate is too large.', ['degree_cert' => 'Maximum file size is 5 MB.']);
    }

    // Check the file's real content, not the name the browser sent.
    $head = (string) file_get_contents($file['tmp_name'], false, null, 0, 8);
    $types = ["%PDF" => 'pdf', "\xFF\xD8\xFF" => 'jpg', "\x89PNG" => 'png'];
    $ext = null;
    foreach ($types as $magic => $type) {
        if (strncmp($head, $magic, strlen($magic)) === 0) {
            $ext = $type;
            break;
        }
    }
    if ($ext === null) {
        throw new HttpError(422, 'Unsupported file type.', ['degree_cert' => 'Upload a PDF, JPG or PNG file.']);
    }

    $dir = config('uploads.dir');
    if (!is_dir($dir) && !mkdir($dir, 0750, true)) {
        throw new RuntimeException("Upload directory {$dir} is not writable.");
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
        throw new RuntimeException('Could not move uploaded file.');
    }
    return $name;
}

// POST /auth/register  (multipart/form-data, because of the optional certificate upload)
function handle_register(): array
{
    $errors = [];

    $email = normalize_email(str_input('email', 190));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    } elseif (($_SESSION['verified_email'] ?? null) !== $email) {
        $errors['email'] = 'Please verify this email with the OTP code first.';
    } elseif (email_is_registered($email)) {
        $errors['email'] = 'This email is already registered.';
    }

    $stmt = db()->prepare('SELECT id FROM faculties WHERE slug = ?');
    $stmt->execute([str_input('faculty', 50)]);
    $facultyId = $stmt->fetchColumn();
    if (!$facultyId) {
        $errors['faculty'] = 'Select your faculty.';
    }

    $fullName = str_input('full_name', 200);
    $preferredName = str_input('preferred_name', 100);
    $phone = str_input('phone', 30);
    if ($fullName === '') {
        $errors['full_name'] = 'Enter your full name.';
    }
    if ($preferredName === '') {
        $errors['preferred_name'] = 'Enter your preferred name.';
    }
    if (!preg_match('/^\+?[0-9 ()-]{7,20}$/', $phone)) {
        $errors['phone'] = 'Enter a valid phone number.';
    }

    $password = password_input('password');
    if ($passwordError = validate_password($password)) {
        $errors['password'] = $passwordError;
    }

    $gradYear = (int) str_input('grad_year', 4);
    if ($gradYear < MIN_GRAD_YEAR || $gradYear > (int) date('Y')) {
        $errors['grad_year'] = 'Select your year of graduation.';
    }

    $regNo = null;
    $hasCert = isset($_FILES['degree_cert']) && $_FILES['degree_cert']['error'] !== UPLOAD_ERR_NO_FILE;
    if (str_input('remember_reg_no', 3) === 'yes') {
        $regNo = strtoupper(str_input('reg_no', 30));
        if (!preg_match('#^[A-Z0-9][A-Z0-9/ .-]{2,29}$#', $regNo) || !preg_match('/\d/', $regNo)) {
            $errors['reg_no'] = 'Enter your registration number, e.g. E/16/123.';
        }
    } elseif (!$hasCert) {
        $errors['degree_cert'] = 'Upload your degree certificate.';
    }

    [$details, $detailErrors] = validate_more_details(bool_input('include_details'));
    $errors += $detailErrors;

    if ($errors) {
        throw new HttpError(422, 'Please correct the highlighted fields.', $errors);
    }

    $certPath = $regNo === null ? store_degree_certificate($_FILES['degree_cert']) : null;

    try {
        db()->prepare(
            'INSERT INTO users (role, email, password_hash, full_name, preferred_name, phone, faculty_id, grad_year,
                                reg_no, degree_cert_path, directory_consent, current_country, linkedin,
                                profession_org, alumni_membership, contact_by, contribute)
             VALUES (\'alumni\', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            $fullName,
            $preferredName,
            $phone,
            $facultyId,
            $gradYear,
            $regNo,
            $certPath,
            bool_input('directory_consent') ? 1 : 0,
            $details['current_country'],
            $details['linkedin'],
            $details['profession_org'],
            $details['alumni_membership'],
            $details['contact_by'],
            $details['contribute'],
        ]);
    } catch (PDOException $e) {
        if ($certPath !== null) {
            @unlink(config('uploads.dir') . '/' . $certPath);
        }
        if ($e->getCode() === '23000') {
            throw new HttpError(409, 'This email is already registered.', ['email' => 'Already registered.']);
        }
        throw $e;
    }

    $userId = (int) db()->lastInsertId();
    unset($_SESSION['verified_email']);
    log_in_user($userId);

    return ['user' => user_payload(find_user($userId))];
}
