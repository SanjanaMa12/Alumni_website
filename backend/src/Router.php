<?php
declare(strict_types=1);

/**
 * Minimal router. Paths may contain {id} placeholders, which are passed
 * to the handler as integer arguments.
 */
class Router
{
    private array $routes = [];

    public function add(string $method, string $path, callable $handler): void
    {
        $pattern = '#^' . preg_replace('#\{\w+\}#', '(\d+)', $path) . '$#';
        $this->routes[] = [$method, $pattern, $handler];
    }

    public function get(string $path, callable $handler): void    { $this->add('GET', $path, $handler); }
    public function post(string $path, callable $handler): void   { $this->add('POST', $path, $handler); }
    public function put(string $path, callable $handler): void    { $this->add('PUT', $path, $handler); }
    public function delete(string $path, callable $handler): void { $this->add('DELETE', $path, $handler); }

    public function dispatch(string $method, string $path): void
    {
        $pathMatched = false;
        foreach ($this->routes as [$routeMethod, $pattern, $handler]) {
            if (!preg_match($pattern, $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($routeMethod !== $method) {
                continue;
            }
            $args = array_map('intval', array_slice($matches, 1));
            try {
                $result = $handler(...$args);
                json_response($result ?? ['ok' => true]);
            } catch (HttpError $e) {
                $body = ['error' => $e->getMessage()];
                if ($e->fields) {
                    $body['fields'] = $e->fields;
                }
                json_response($body, $e->status);
            }
        }
        if ($pathMatched) {
            json_response(['error' => 'Method not allowed.'], 405);
        }
        json_response(['error' => 'Not found.'], 404);
    }
}
