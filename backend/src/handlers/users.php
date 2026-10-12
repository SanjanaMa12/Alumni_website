<?php
declare(strict_types=1);

const CONTACT_BY_OPTIONS = ['students_mentoring', 'university_events', 'other_alumni'];
const CONTRIBUTE_OPTIONS = ['mentoring', 'guest_lecture', 'internship', 'donation', 'scholarships', 'networking', 'not_now'];
const MIN_GRAD_YEAR = 1950;

function find_user(int $id): ?array
{
    $stmt = db()->prepare(
        'SELECT u.*, f.slug AS faculty_slug, f.name AS faculty_name
           FROM users u
           LEFT JOIN faculties f ON f.id = u.faculty_id
          WHERE u.id = ?'
    );
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

/** The fields of a user that are safe to send to that user's own browser. */
function user_payload(array $u): array
{
    return [
        'id'                  => (int) $u['id'],
        'role'                => $u['role'],
        'email'               => $u['email'],
        'full_name'           => $u['full_name'],
        'preferred_name'      => $u['preferred_name'],
        'phone'               => $u['phone'],
        'faculty'             => $u['faculty_slug'] ? ['slug' => $u['faculty_slug'], 'name' => $u['faculty_name']] : null,
        'grad_year'           => $u['grad_year'] !== null ? (int) $u['grad_year'] : null,
        'reg_no'              => $u['reg_no'],
        'has_degree_cert'     => $u['degree_cert_path'] !== null,
        'directory_consent'   => (bool) $u['directory_consent'],
        'current_country'     => $u['current_country'],
        'linkedin'            => $u['linkedin'],
        'profession_org'      => $u['profession_org'],
        'alumni_membership'   => $u['alumni_membership'],
        'contact_by'          => $u['contact_by'] ? explode(',', $u['contact_by']) : [],
        'contribute'          => $u['contribute'] ? explode(',', $u['contribute']) : [],
        'verification_status' => $u['verification_status'],
        'created_at'          => $u['created_at'],
    ];
}

/**
 * Validates the optional "More Details" part of the registration / profile form.
 * Returns [columns, errors].
 */
function validate_more_details(bool $required): array
{
    $errors = [];
    $data = [
        'current_country'   => str_input('current_country', 100) ?: null,
        'linkedin'          => str_input('linkedin', 255) ?: null,
        'profession_org'    => str_input('profession_org', 255) ?: null,
        'alumni_membership' => str_input('alumni_membership', 255) ?: null,
        'contact_by'        => implode(',', set_input('contact_by', CONTACT_BY_OPTIONS)) ?: null,
        'contribute'        => implode(',', set_input('contribute', CONTRIBUTE_OPTIONS)) ?: null,
    ];

    if ($data['linkedin'] !== null && !preg_match('#^https?://([a-z0-9-]+\.)*linkedin\.com/#i', $data['linkedin'])) {
        $errors['linkedin'] = 'Enter a full LinkedIn URL, e.g. https://linkedin.com/in/your-name';
    }
    if ($required) {
        if ($data['current_country'] === null) {
            $errors['current_country'] = 'Select your country of residence.';
        }
        if ($data['profession_org'] === null) {
            $errors['profession_org'] = 'Enter your current profession or organization.';
        }
        if ($data['contact_by'] === null) {
            $errors['contact_by'] = 'Choose at least one option.';
        }
        if ($data['contribute'] === null) {
            $errors['contribute'] = 'Choose at least one option.';
        }
    }
    return [$data, $errors];
}

function validate_password(string $password): ?string
{
    if (strlen($password) < 8) {
        return 'Password must be at least 8 characters.';
    }
    if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
        return 'Password must contain both letters and numbers.';
    }
    return null;
}
