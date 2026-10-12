<?php
declare(strict_types=1);

const LOGIN_ROLES = ['alumni', 'student'];

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function email_input(): string
{
    $email = normalize_email(str_input('email', 190));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new HttpError(422, 'Enter a valid email address.', ['email' => 'Enter a valid email address.']);
    }
    return $email;
}

function role_input(): string
{
    $role = str_input('role', 20);
    if (!in_array($role, LOGIN_ROLES, true)) {
        throw new HttpError(422, 'Choose Alumni Login or Student Login.');
    }
    return $role;
}

function code_input(): string
{
    return preg_replace('/\D/', '', str_input('code', 10));
}

/**
 * Decides whether this email may log in on the chosen tab.
 * Returns the existing account, or null for a student logging in for the first time.
 *   Alumni tab:  the email must belong to a VERIFIED alumni account.
 *   Student tab: the email must be on a university domain (config: student_email_domains).
 */
function login_account(string $email, string $role): ?array
{
    $user = find_user_by_email($email);

    if ($user && $user['role'] === 'admin') {
        return $user;
    }

    if ($role === 'alumni') {
        if (!$user) {
            throw new HttpError(404, 'No alumni account found for this email. Please register first.', ['email' => 'Not registered.']);
        }
        if ($user['role'] === 'student') {
            throw new HttpError(403, 'This is a student account. Please use Student Login.');
        }
        if ($user['verification_status'] === 'pending') {
            throw new HttpError(403, 'Your registration is still being verified by the Alumni Relations Office. You can log in once it is approved.');
        }
        if ($user['verification_status'] === 'rejected') {
            throw new HttpError(403, 'We could not verify your alumni record. Please contact aro@pdn.ac.lk.');
        }
        return $user;
    }

    if ($user && $user['role'] === 'alumni') {
        throw new HttpError(403, 'This email is registered as an alumni account. Please use Alumni Login.');
    }
    if (!is_student_email($email)) {
        $domains = implode(', ', array_map(fn ($d) => '@' . ltrim($d, '@'), config('student_email_domains', [])));
        throw new HttpError(422, "Student Login needs your university email ({$domains} or a faculty address such as @sci.pdn.ac.lk).", ['email' => 'Use your university email.']);
    }
    return $user;
}

/** First Student Login: create the account, named from the email until they edit it. */
function create_student(string $email): array
{
    $local = strstr($email, '@', true) ?: $email;
    $name = mb_substr(ucwords(strtolower(trim(preg_replace('/[._-]+/', ' ', $local)))), 0, 100);

    db()->prepare(
        "INSERT INTO users (role, email, full_name, preferred_name, verification_status) VALUES ('student', ?, ?, ?, 'verified')"
    )->execute([$email, $name, $name]);

    return find_user((int) db()->lastInsertId());
}

// GET /auth/me
function handle_me(): array
{
    $user = current_user();
    return ['user' => $user ? user_payload($user) : null];
}

// POST /auth/login/otp  { email, role }  - step 1: email a login code
function handle_login_send_otp(): array
{
    $email = email_input();
    login_account($email, role_input());
    return otp_issue($email, 'login');
}

// POST /auth/login/verify  { email, role, code }  - step 2: check the code and log in
function handle_login_verify(): array
{
    $email = email_input();
    // Checked again: the account may have changed since the code was sent.
    $user = login_account($email, role_input());
    otp_consume($email, 'login', code_input());

    $user = $user ?? create_student($email);
    issue_auth_token($user);
    return ['user' => user_payload($user)];
}

// POST /auth/logout
function handle_logout(): array
{
    clear_auth_cookie();
    return ['ok' => true];
}

// POST /auth/register/otp  { email }  - prove the address belongs to the person registering
function handle_register_send_otp(): array
{
    $email = email_input();
    if (find_user_by_email($email)) {
        throw new HttpError(409, 'This email is already registered. Please log in instead.', ['email' => 'Already registered.']);
    }
    return otp_issue($email, 'register');
}

// POST /auth/register/verify  { email, code }
// Returns a short-lived registration token that must be sent with the registration form.
function handle_register_verify(): array
{
    $email = email_input();
    otp_consume($email, 'register', code_input());

    $ttl = (int) config('jwt.registration_ttl_minutes', 30) * 60;
    return [
        'ok'                 => true,
        'verified'           => true,
        'registration_token' => jwt_encode(['purpose' => 'register', 'email' => $email], $ttl),
    ];
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
    $proof = jwt_decode(str_input('registration_token', 2000), 'register');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address.';
    } elseif (!$proof || $proof['email'] !== $email) {
        $errors['email'] = 'Please verify this email with the OTP code first.';
    } elseif (find_user_by_email($email)) {
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
            'INSERT INTO users (role, email, full_name, preferred_name, phone, faculty_id, grad_year,
                                reg_no, degree_cert_path, directory_consent, current_country, linkedin,
                                profession_org, alumni_membership, contact_by, contribute)
             VALUES (\'alumni\', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $email,
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

    // No automatic login: alumni can log in once the ARO has verified them.
    return [
        'ok'      => true,
        'message' => 'Registration received. The Alumni Relations Office will verify your details, and then you can log in with your email.',
    ];
}
