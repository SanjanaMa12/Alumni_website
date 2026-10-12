<?php
declare(strict_types=1);

// PUT /profile  - the details an alumnus can edit after registering
function handle_update_profile(): array
{
    $userId = require_login();
    $user = current_user();
    $errors = [];

    // Students' accounts are named from their email on first login, so they may fix it.
    // Alumni names come from the verified record and are changed by the ARO only.
    $fullName = $user['full_name'];
    if ($user['role'] === 'student') {
        $fullName = str_input('full_name', 200);
        if ($fullName === '') {
            $errors['full_name'] = 'Enter your full name.';
        }
    }

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
            SET full_name = ?, preferred_name = ?, phone = ?, directory_consent = ?, current_country = ?, linkedin = ?,
                profession_org = ?, alumni_membership = ?, contact_by = ?, contribute = ?
          WHERE id = ?'
    )->execute([
        $fullName,
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
