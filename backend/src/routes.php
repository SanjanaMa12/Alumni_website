<?php
declare(strict_types=1);

require __DIR__ . '/handlers/users.php';
require __DIR__ . '/handlers/auth.php';
require __DIR__ . '/handlers/content.php';
require __DIR__ . '/handlers/directory.php';
require __DIR__ . '/handlers/profile.php';

$router = new Router();

$router->get('/health', fn () => ['ok' => true]);

$router->get('/auth/me', 'handle_me');
$router->post('/auth/login', 'handle_login');
$router->post('/auth/logout', 'handle_logout');
$router->post('/auth/otp/send', 'handle_send_otp');
$router->post('/auth/otp/verify', 'handle_verify_otp');
$router->post('/auth/register', 'handle_register');

$router->get('/faculties', 'handle_faculties');
$router->get('/people', 'handle_people');
$router->get('/projects', 'handle_projects');
$router->get('/events', 'handle_events');
$router->post('/events/{id}/register', 'handle_event_register');
$router->delete('/events/{id}/register', 'handle_event_unregister');

$router->get('/directory', 'handle_directory');

$router->put('/profile', 'handle_update_profile');
$router->post('/profile/password', 'handle_change_password');

return $router;
