<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

echo json_encode([
    'success' => true,
    'authenticated' => isset($_SESSION['admin_user_id']),
    'admin_user_id' => $_SESSION['admin_user_id'] ?? null,
    'admin_email' => $_SESSION['admin_email'] ?? null,
    'two_factor_verified' => $_SESSION['admin_2fa_verified'] ?? false
]);