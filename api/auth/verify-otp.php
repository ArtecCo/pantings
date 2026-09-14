<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$otp = trim((string)($data['otp'] ?? ''));
$adminId = (int)($_SESSION['pending_admin_id'] ?? 0);
$pending = ($_SESSION['admin_2fa_pending'] ?? false) === true;

if ($adminId <= 0 || !$pending) {
    adminJsonResponse(['success' => false, 'message' => 'No OTP verification is pending'], 401);
}
if (!preg_match('/^\d{6}$/', $otp)) {
    adminJsonResponse(['success' => false, 'message' => 'OTP must be six digits'], 422);
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, otp_hash, expires_at, attempts
         FROM admin_otp_codes
         WHERE admin_user_id = ? AND used_at IS NULL
         ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record || (int)$record['attempts'] >= 5) {
        adminJsonResponse(['success' => false, 'message' => 'OTP is invalid or unavailable'], 401);
    }
    if (strtotime((string)$record['expires_at']) <= time()) {
        adminJsonResponse(['success' => false, 'message' => 'OTP has expired'], 401);
    }

    if (!hash_equals((string)$record['otp_hash'], hash('sha256', $otp))) {
        $stmt = $pdo->prepare('UPDATE admin_otp_codes SET attempts = attempts + 1 WHERE id = ?');
        $stmt->execute([(int)$record['id']]);
        adminJsonResponse(['success' => false, 'message' => 'Incorrect OTP'], 401);
    }

    $stmt = $pdo->prepare('UPDATE admin_otp_codes SET used_at = NOW() WHERE id = ? AND used_at IS NULL');
    $stmt->execute([(int)$record['id']]);
    if ($stmt->rowCount() !== 1) {
        adminJsonResponse(['success' => false, 'message' => 'OTP has already been used'], 409);
    }

    $stmt = $pdo->prepare('SELECT id, email, first_name, last_name, is_active FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$admin || !(int)$admin['is_active']) {
        $_SESSION = [];
        session_destroy();
        adminJsonResponse(['success' => false, 'message' => 'Administrator account is unavailable'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['admin_user_id'] = $adminId;
    $_SESSION['admin_user_type'] = 'admin';
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['admin_authenticated_at'] = time();
    $_SESSION['admin_2fa_verified'] = true;
    unset($_SESSION['pending_admin_id'], $_SESSION['pending_admin_email'], $_SESSION['admin_2fa_pending']);

    $stmt = $pdo->prepare('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?');
    $stmt->execute([$adminId]);

    adminJsonResponse([
        'success' => true,
        'message' => 'Admin login successful',
        'admin' => [
            'id' => $adminId,
            'email' => $admin['email'],
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('Admin OTP verification error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to verify OTP right now'], 500);
}
