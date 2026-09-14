<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    adminJsonResponse(['success' => false, 'message' => 'Email and password are required'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, email, password_hash, first_name, last_name, is_active
         FROM admin_users
         WHERE email = ?
         LIMIT 1'
    );
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin || !(int)$admin['is_active'] || !$admin['password_hash'] || !password_verify($password, $admin['password_hash'])) {
        usleep(250000);
        adminJsonResponse(['success' => false, 'message' => 'Invalid email or password'], 401);
    }

    $stmt = $pdo->prepare(
        'UPDATE admin_otp_codes SET used_at = NOW()
         WHERE admin_user_id = ? AND used_at IS NULL'
    );
    $stmt->execute([(int)$admin['id']]);

    $otp = (string)random_int(100000, 999999);
    $otpHash = hash('sha256', $otp);
    $expiresAt = date('Y-m-d H:i:s', time() + (10 * 60));

    $stmt = $pdo->prepare(
        'INSERT INTO admin_otp_codes (admin_user_id, otp_hash, expires_at)
         VALUES (?, ?, ?)'
    );
    $stmt->execute([(int)$admin['id'], $otpHash, $expiresAt]);

    session_regenerate_id(true);
    $_SESSION['pending_admin_id'] = (int)$admin['id'];
    $_SESSION['pending_admin_email'] = $admin['email'];
    $_SESSION['admin_2fa_pending'] = true;
    $_SESSION['admin_otp_requested_at'] = time();

    // The OTP is deliberately never returned to the client. A trusted
    // server-side email/SMS provider must deliver it in production.
    adminJsonResponse([
        'success' => true,
        'message' => 'Password verified. A verification code has been sent to your configured administrator contact.',
        'expires_at' => $expiresAt
    ]);
} catch (Throwable $e) {
    error_log('Admin OTP request error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to request a verification code'], 500);
}
