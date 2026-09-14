<?php
declare(strict_types=1);

$isHttps = !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
$cookieDomain = trim((string)(getenv('SESSION_COOKIE_DOMAIN') ?: ''));
$sameSite = trim((string)(getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax'));
if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true)) {
    $sameSite = 'Lax';
}
if ($sameSite === 'None' && !$isHttps) {
    $sameSite = 'Lax';
}

session_name('painting_marketplace_admin_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $cookieDomain,
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => $sameSite,
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

$configuredOrigins = trim((string)(getenv('ALLOWED_ADMIN_ORIGINS') ?: getenv('ALLOWED_ORIGINS') ?: ''));
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

function adminJsonResponse(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function adminRequestJson(): array {
    $data = json_decode(file_get_contents('php://input') ?: '{}', true);
    return is_array($data) ? $data : [];
}

function requireAdmin(): int {
    if (!isset($_SESSION['admin_user_id'])
        || ($_SESSION['admin_user_type'] ?? '') !== 'admin'
        || ($_SESSION['admin_2fa_verified'] ?? false) !== true) {
        adminJsonResponse(['success' => false, 'message' => 'Admin authentication required'], 401);
    }
    return (int)$_SESSION['admin_user_id'];
}
