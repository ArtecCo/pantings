<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$otp = trim((string)($data['otp'] ?? ''));
$adminId = (int)($_SESSION['pending_admin_id'] ?? 0);
$twoFactorPending = !empty($_SESSION['admin_2fa_pending']);

if ($adminId <= 0 || !$twoFactorPending) {
    adminJsonResponse(['success' => false, 'message' => 'No OTP verification is pending'], 401);
}
if (!preg_match('/^\d{6}$/', $otp)) {
    adminJsonResponse(['success' => false, 'message' => 'OTP must be six digits'], 400);
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, otp_hash, expires_at, attempts
         FROM admin_otp_codes
         WHERE admin_user_id = ? AND used_at IS NULL
         ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $otpRecord = $stmt->fetch();

    if (!$otpRecord) {
        adminJsonResponse(['success' => false, 'message' => 'OTP is invalid or has expired'], 401);
    }
    if ((int)$otpRecord['attempts'] >= 5) {
        adminJsonResponse(['success' => false, 'message' => 'Too many incorrect attempts'], 429);
    }
    if (strtotime($otpRecord['expires_at']) < time()) {
        adminJsonResponse(['success' => false, 'message' => 'OTP has expired'], 401);
    }

    $candidateHash = hash('sha256', $otp);
    if (!hash_equals((string)$otpRecord['otp_hash'], $candidateHash)) {
        $stmt = $pdo->prepare('UPDATE admin_otp_codes SET attempts = attempts + 1 WHERE id = ? AND used_at IS NULL');
        $stmt->execute([(int)$otpRecord['id']]);
        adminJsonResponse(['success' => false, 'message' => 'Incorrect OTP'], 401);
    }

    $stmt = $pdo->prepare('UPDATE admin_otp_codes SET used_at = NOW() WHERE id = ? AND used_at IS NULL');
    $stmt->execute([(int)$otpRecord['id']]);
    if ($stmt->rowCount() !== 1) {
        adminJsonResponse(['success' => false, 'message' => 'OTP is invalid or has already been used'], 409);
    }

    session_regenerate_id(true);
    $_SESSION['admin_user_id'] = $adminId;
    $_SESSION['admin_user_type'] = 'admin';
    $_SESSION['admin_authenticated_at'] = time();
    unset($_SESSION['pending_admin_id'], $_SESSION['pending_admin_email'], $_SESSION['admin_2fa_pending'], $_SESSION['admin_otp_requested_at']);

    $stmt = $pdo->prepare(
        'SELECT id, email, first_name, last_name
         FROM admin_users WHERE id = ? AND is_active = 1 LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch();

    if (!$admin) {
        unset($_SESSION['admin_user_id'], $_SESSION['admin_user_type'], $_SESSION['admin_authenticated_at']);
        adminJsonResponse(['success' => false, 'message' => 'Administrator account is unavailable'], 401);
    }

    $stmt = $pdo->prepare('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?');
    $stmt->execute([$adminId]);

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO audit_logs
            (admin_user_id, admin_email, action, module, record_type, record_id, description, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $adminId,
            $admin['email'],
            'LOGIN',
            'AUTH',
            'ADMIN_USER',
            $adminId,
            'Administrator completed 2FA login',
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Throwable $auditError) {
        error_log('Admin login audit error: ' . $auditError->getMessage());
    }

    adminJsonResponse([
        'success' => true,
        'message' => 'Admin login successful',
        'admin' => [
            'id' => (int)$admin['id'],
            'email' => $admin['email'],
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name']
        ]
    ]);
} catch (Throwable $e) {
    error_log('Admin OTP verification error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to verify the code'], 500);
}
