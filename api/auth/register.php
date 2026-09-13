<?php

require_once __DIR__ . '/../config/database.php';

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

$firstName = trim($data['first_name'] ?? '');
$lastName  = trim($data['last_name'] ?? '');
$email     = strtolower(trim($data['email'] ?? ''));
$phone     = trim($data['phone'] ?? '');
$password  = $data['password'] ?? '';

if (!$firstName || !$email || !$password) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'First name, email and password are required'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email address'
    ]);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 8 characters'
    ]);
    exit;
}

$stmt = $pdo->prepare(
    'SELECT id FROM users WHERE email = ? LIMIT 1'
);
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'An account with this email already exists'
    ]);
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'INSERT INTO users
    (email, phone, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?)'
);

$stmt->execute([
    $email,
    $phone ?: null,
    $passwordHash,
    $firstName,
    $lastName ?: null
]);

$userId = $pdo->lastInsertId();

echo json_encode([
    'success' => true,
    'message' => 'Account created successfully',
    'user' => [
        'id' => (int) $userId,
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName
    ]
]);