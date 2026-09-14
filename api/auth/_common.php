<?php
declare(strict_types=1);

// Session cookies must be configured before session_start(). Keep local HTTP
// development working while automatically enabling Secure cookies on HTTPS.
$isHttps = !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
$cookieSecure = $isHttps;
$cookieDomain = trim((string)(getenv('SESSION_COOKIE_DOMAIN') ?: ''));
$sameSite = trim((string)(getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax'));
if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true)) {
    $sameSite = 'Lax';
}

session_name('painting_marketplace_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $cookieDomain,
    'secure' => $cookieSecure,
    'httponly' => true,
    'samesite' => $sameSite,
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

$configuredOrigins = trim((string)(getenv('ALLOWED_ORIGINS') ?: ''));
$allowedOrigins = $configuredOrigins !== ''
    ? array_values(array_filter(array_map('trim', explode(',', $configuredOrigins))))
    : ['http://localhost:5173', 'http://localhost:5174'];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
        http_response_code(403);
        exit;
    }
    http_response_code(204);
    exit;
}

function jsonResponse(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function requestJson(): array {
    $raw = file_get_contents('php://input') ?: '{}';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function requireCustomer(): int {
    if (!isset($_SESSION['user_id']) || ($_SESSION['user_type'] ?? '') !== 'customer') {
        jsonResponse(['success' => false, 'message' => 'User authentication required'], 401);
    }

    return (int)$_SESSION['user_id'];
}
