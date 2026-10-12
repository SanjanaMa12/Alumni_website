<?php
declare(strict_types=1);

const DIRECTORY_PAGE_SIZE = 24;

// GET /directory?q=&faculty=&year=&page=
// Only verified alumni who opted in are listed, and only the fields the
// registration form promised to show: name, faculty and batch.
function handle_directory(): array
{
    require_login();

    $where = ["u.role = 'alumni'", 'u.directory_consent = 1', "u.verification_status = 'verified'"];
    $params = [];

    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(u.full_name LIKE ? OR u.preferred_name LIKE ?)';
        $like = '%' . addcslashes(mb_substr($q, 0, 100), '%_\\') . '%';
        array_push($params, $like, $like);
    }
    $faculty = trim((string) ($_GET['faculty'] ?? ''));
    if ($faculty !== '') {
        $where[] = 'f.slug = ?';
        $params[] = $faculty;
    }
    $year = (int) ($_GET['year'] ?? 0);
    if ($year > 0) {
        $where[] = 'u.grad_year = ?';
        $params[] = $year;
    }

    $from = ' FROM users u LEFT JOIN faculties f ON f.id = u.faculty_id WHERE ' . implode(' AND ', $where);

    $count = db()->prepare('SELECT COUNT(*)' . $from);
    $count->execute($params);
    $total = (int) $count->fetchColumn();

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $offset = ($page - 1) * DIRECTORY_PAGE_SIZE;
    $stmt = db()->prepare(
        'SELECT u.id, u.full_name, u.preferred_name, u.grad_year, f.slug AS faculty_slug, f.name AS faculty_name'
        . $from
        . ' ORDER BY u.full_name LIMIT ' . DIRECTORY_PAGE_SIZE . ' OFFSET ' . $offset
    );
    $stmt->execute($params);

    $alumni = array_map(fn ($r) => [
        'id'             => (int) $r['id'],
        'full_name'      => $r['full_name'],
        'preferred_name' => $r['preferred_name'],
        'grad_year'      => $r['grad_year'] !== null ? (int) $r['grad_year'] : null,
        'faculty'        => $r['faculty_slug'] ? ['slug' => $r['faculty_slug'], 'name' => $r['faculty_name']] : null,
    ], $stmt->fetchAll());

    return [
        'alumni'    => $alumni,
        'total'     => $total,
        'page'      => $page,
        'page_size' => DIRECTORY_PAGE_SIZE,
    ];
}
