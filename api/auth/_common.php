<?php
declare(strict_types=1);

$isHttps = !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
$sameSite = trim((string)(getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax'));
if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true) || ($sameSite === 'None' && !$isHttps)) {
    $sameSite = 'Lax';
}

session_name('painting_marketplace_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => trim((string)(getenv('SESSION_COOKIE_DOMAIN') ?: '')),
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => $sameSite,
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

$configuredOrigins = trim((string)(getenv('ALLOWED_ORIGINS') ?: ''));
$allowedOrigins = array_values(array_unique(array_filter(array_merge(
    $configuredOrigins !== '' ? array_map('trim', explode(',', $configuredOrigins)) : [],
    [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://arts.araha.co.in',
        'https://artsadmin.araha.co.in',
    ]
))));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Vary: Origin');
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
    $data = json_decode(file_get_contents('php://input') ?: '{}', true);
    return is_array($data) ? $data : [];
}

function requireCustomer(): int {
    $userId = (int)($_SESSION['user_id'] ?? 0);
    if ($userId <= 0 || ($_SESSION['user_type'] ?? '') !== 'customer') {
        jsonResponse(['success' => false, 'authenticated' => false, 'message' => 'User authentication required'], 401);
    }
    return $userId;
}
