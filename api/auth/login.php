<?php

require_once __DIR__ . '/../config/database.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);
    exit;
}

$stmt = $pdo->prepare(
    'SELECT id, email, password_hash, first_name, last_name, is_active
     FROM users
     WHERE email = ?
     LIMIT 1'
);

$stmt->execute([$email]);

$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

if (!$user['is_active']) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Account is inactive'
    ]);
    exit;
}

session_regenerate_id(true);

$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['user_type'] = 'customer';

echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name']
    ]
]);