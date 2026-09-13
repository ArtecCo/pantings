<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = requestJson();
$type = $data['type'] ?? 'email'; // 'email' or 'google'

if ($type === 'google') {
    $token = $data['token'] ?? '';
    if (!$token) {
        jsonResponse(['success' => false, 'message' => 'Google token is required'], 400);
    }

    // Verify token with Google public endpoint
    $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
    
    $ch = curl_init($verifyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        jsonResponse(['success' => false, 'message' => 'Invalid Google token'], 401);
    }

    $googleUser = json_decode($response, true);
    if (!isset($googleUser['email'])) {
        jsonResponse(['success' => false, 'message' => 'Invalid token payload'], 401);
    }

    $email = strtolower(trim($googleUser['email']));
    $firstName = $googleUser['given_name'] ?? 'User';
    $lastName = $googleUser['family_name'] ?? '';

    // Check if user exists
    $stmt = $pdo->prepare('SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Create user with empty password hash for Google-only users
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$email, '', $firstName, $lastName]);
        
        $userId = $pdo->lastInsertId();
        $user = [
            'id' => (int)$userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName
        ];
    }

    // Log the user in
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_authenticated_at'] = time();

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name']
        ]
    ]);
} else {
    // Standard Email/Password login
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        jsonResponse(['success' => false, 'message' => 'Email and password are required.'], 422);
    }

    try {
        $stmt = $pdo->prepare('SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
            usleep(250000); // Prevent timing attacks
            jsonResponse(['success' => false, 'message' => 'Invalid email or password.'], 401);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_authenticated_at'] = time();

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name']
            ]
        ]);
    } catch (Throwable $e) {
        error_log('User login: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => 'Unable to sign in right now.'], 500);
    }
}
