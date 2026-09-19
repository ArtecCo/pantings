<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../email-validation/email-validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = requestJson();
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');
$firstName = trim((string)($data['first_name'] ?? ''));
$lastName = trim((string)($data['last_name'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Enter a valid email address.'], 422);
}

if (!isAllowedEmailDomain($email)) {
    jsonResponse(['success' => false, 'message' => 'Please use a non-disposable email address.'], 422);
}

if (strlen($password) < 8) {
    jsonResponse(['success' => false, 'message' => 'Password must be at least 8 characters long.'], 422);
}

if ($firstName === '') {
    jsonResponse(['success' => false, 'message' => 'First name is required.'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE LOWER(email)=? LIMIT 1');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'An account with this email already exists.'], 409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $insert = $pdo->prepare(
        'INSERT INTO users (email,password_hash,first_name,last_name) VALUES (?,?,?,?)'
    );
    $insert->execute([$email, $passwordHash, $firstName, $lastName]);

    $userId = (int)$pdo->lastInsertId();

    session_regenerate_id(true);
    unset(
        $_SESSION['admin_user_id'],
        $_SESSION['admin_user_type'],
        $_SESSION['admin_email'],
        $_SESSION['admin_authenticated_at'],
        $_SESSION['admin_2fa_verified'],
        $_SESSION['admin_pending_user_id'],
        $_SESSION['admin_pending_email'],
        $_SESSION['admin_otp_required']
    );

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_type'] = 'customer';
    $_SESSION['user_email'] = $email;
    $_SESSION['user_authenticated_at'] = time();

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName
        ]
    ], 201);
} catch (PDOException $e) {
    if ((string)$e->getCode() === '23000') {
        jsonResponse(['success' => false, 'message' => 'An account with this email already exists.'], 409);
    }

    error_log('User registration: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to create your account right now.'], 500);
} catch (Throwable $e) {
    error_log('User registration: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to create your account right now.'], 500);
}
