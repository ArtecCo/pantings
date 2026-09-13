<?php

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'customer') {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);

    exit;
}

$stmt = $pdo->prepare(
    'SELECT id, email, phone, first_name, last_name, is_active
     FROM users
     WHERE id = ?
     LIMIT 1'
);

$stmt->execute([$_SESSION['user_id']]);

$user = $stmt->fetch();

if (!$user || !$user['is_active']) {
    session_destroy();

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'User account is unavailable'
    ]);

    exit;
}

echo json_encode([
    'success' => true,
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name']
    ]
]);