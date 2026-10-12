<?php
declare(strict_types=1);

require __DIR__ . '/handlers/users.php';
require __DIR__ . '/handlers/otp.php';
require __DIR__ . '/handlers/auth.php';
require __DIR__ . '/handlers/content.php';
require __DIR__ . '/handlers/directory.php';
require __DIR__ . '/handlers/profile.php';

$router = new Router();

$router->get('/health', fn () => ['ok' => true]);

$router->get('/auth/me', 'handle_me');
$router->post('/auth/login/otp', 'handle_login_send_otp');
$router->post('/auth/login/verify', 'handle_login_verify');
$router->post('/auth/logout', 'handle_logout');
$router->post('/auth/register/otp', 'handle_register_send_otp');
$router->post('/auth/register/verify', 'handle_register_verify');
$router->post('/auth/register', 'handle_register');

$router->get('/faculties', 'handle_faculties');
$router->get('/people', 'handle_people');
$router->get('/projects', 'handle_projects');
$router->get('/events', 'handle_events');
$router->post('/events/{id}/register', 'handle_event_register');
$router->delete('/events/{id}/register', 'handle_event_unregister');

$router->get('/directory', 'handle_directory');

$router->put('/profile', 'handle_update_profile');

return $router;
