<?php
declare(strict_types=1);

// PUT /profile  - the details an alumnus can edit after registering
function handle_update_profile(): array
{
    $userId = require_login();
    $errors = [];

    $preferredName = str_input('preferred_name', 100);
    $phone = str_input('phone', 30);
    if ($preferredName === '') {
        $errors['preferred_name'] = 'Enter your preferred name.';
    }
    if ($phone !== '' && !preg_match('/^\+?[0-9 ()-]{7,20}$/', $phone)) {
        $errors['phone'] = 'Enter a valid phone number.';
    }

    [$details, $detailErrors] = validate_more_details(false);
    $errors += $detailErrors;

    if ($errors) {
        throw new HttpError(422, 'Please correct the highlighted fields.', $errors);
    }

    db()->prepare(
        'UPDATE users
            SET preferred_name = ?, phone = ?, directory_consent = ?, current_country = ?, linkedin = ?,
                profession_org = ?, alumni_membership = ?, contact_by = ?, contribute = ?
          WHERE id = ?'
    )->execute([
        $preferredName,
        $phone ?: null,
        bool_input('directory_consent') ? 1 : 0,
        $details['current_country'],
        $details['linkedin'],
        $details['profession_org'],
        $details['alumni_membership'],
        $details['contact_by'],
        $details['contribute'],
        $userId,
    ]);

    return ['user' => user_payload(find_user($userId))];
}

// POST /profile/password  { current_password, new_password }
function handle_change_password(): array
{
    $userId = require_login();

    $stmt = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    if (!password_verify(password_input('current_password'), (string) $stmt->fetchColumn())) {
        throw new HttpError(422, 'Current password is incorrect.', ['current_password' => 'Incorrect password.']);
    }

    $new = password_input('new_password');
    if ($error = validate_password($new)) {
        throw new HttpError(422, $error, ['new_password' => $error]);
    }

    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($new, PASSWORD_DEFAULT), $userId]);
    session_regenerate_id(true);

    return ['ok' => true];
}
