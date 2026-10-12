<?php
declare(strict_types=1);

// GET /faculties
function handle_faculties(): array
{
    $rows = db()->query('SELECT slug, name, image FROM faculties ORDER BY sort_order, name')->fetchAll();
    return ['faculties' => $rows];
}

// GET /people
function handle_people(): array
{
    $rows = db()->query('SELECT id, group_key, name, designation, photo FROM people ORDER BY group_key, sort_order, id')->fetchAll();
    $groups = ['leadership' => [], 'overseas_advisory' => [], 'university_advisory' => [], 'aro' => []];
    foreach ($rows as $row) {
        $row['id'] = (int) $row['id'];
        $groups[$row['group_key']][] = $row;
    }
    return ['groups' => $groups];
}

// GET /projects
function handle_projects(): array
{
    $rows = db()->query('SELECT id, title, description, status, progress, theme FROM projects ORDER BY sort_order, id')->fetchAll();
    foreach ($rows as &$row) {
        $row['id'] = (int) $row['id'];
        $row['progress'] = $row['progress'] !== null ? (int) $row['progress'] : null;
    }
    return ['projects' => $rows];
}

function event_payload(array $row): array
{
    return [
        'id'          => (int) $row['id'],
        'title'       => $row['title'],
        'category'    => $row['category'],
        'banner_text' => $row['banner_text'],
        'theme'       => $row['theme'],
        'event_date'  => $row['event_date'],
        'location'    => $row['location'],
        'description' => $row['description'],
        'is_past'     => $row['event_date'] < date('Y-m-d'),
        'attendees'   => (int) $row['attendees'],
        'registered'  => (bool) $row['registered'],
    ];
}

function fetch_events(?int $eventId = null): array
{
    $sql = 'SELECT e.*,
                   (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id) AS attendees,
                   EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.user_id = ?) AS registered
              FROM events e';
    $params = [current_user_id() ?? 0];
    if ($eventId !== null) {
        $sql .= ' WHERE e.id = ?';
        $params[] = $eventId;
    }
    $sql .= ' ORDER BY e.event_date < CURDATE(), e.event_date';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return array_map('event_payload', $stmt->fetchAll());
}

// GET /events
function handle_events(): array
{
    return ['events' => fetch_events()];
}

// POST /events/{id}/register
function handle_event_register(int $eventId): array
{
    $userId = require_login();
    $event = fetch_events($eventId)[0] ?? null;
    if (!$event) {
        throw new HttpError(404, 'Event not found.');
    }
    if ($event['is_past']) {
        throw new HttpError(400, 'This event has already taken place.');
    }
    db()->prepare('INSERT IGNORE INTO event_registrations (event_id, user_id) VALUES (?, ?)')->execute([$eventId, $userId]);
    return ['event' => fetch_events($eventId)[0]];
}

// DELETE /events/{id}/register
function handle_event_unregister(int $eventId): array
{
    $userId = require_login();
    db()->prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?')->execute([$eventId, $userId]);
    $event = fetch_events($eventId)[0] ?? null;
    if (!$event) {
        throw new HttpError(404, 'Event not found.');
    }
    return ['event' => $event];
}
