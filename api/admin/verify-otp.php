<?php

require_once __DIR__ . '/../config/database.php';

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

$otp = trim($data['otp'] ?? '');

$adminId = $_SESSION['pending_admin_id'] ?? null;
$twoFactorPending = $_SESSION['admin_2fa_pending'] ?? false;

if (!$adminId || !$twoFactorPending) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'No OTP verification is pending'
    ]);

    exit;
}

if (!preg_match('/^\d{6}$/', $otp)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'OTP must be six digits'
    ]);

    exit;
}


/*
 * Get the latest unused OTP.
 */
$stmt = $pdo->prepare(
    'SELECT id, otp_hash, expires_at, attempts
     FROM admin_otp_codes
     WHERE admin_user_id = ?
     AND used_at IS NULL
     ORDER BY id DESC
     LIMIT 1'
);

$stmt->execute([(int) $adminId]);

$otpRecord = $stmt->fetch();

if (!$otpRecord) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'OTP is invalid or has expired'
    ]);

    exit;
}


/*
 * Limit failed attempts.
 */
if ((int) $otpRecord['attempts'] >= 5) {

    http_response_code(429);

    echo json_encode([
        'success' => false,
        'message' => 'Too many incorrect attempts'
    ]);

    exit;
}


/*
 * Check expiry.
 */
if (strtotime($otpRecord['expires_at']) < time()) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'OTP has expired'
    ]);

    exit;
}


/*
 * Check OTP.
 */
if (!hash_equals(
    $otpRecord['otp_hash'],
    hash('sha256', $otp)
)) {

    $stmt = $pdo->prepare(
        'UPDATE admin_otp_codes
         SET attempts = attempts + 1
         WHERE id = ?'
    );

    $stmt->execute([(int) $otpRecord['id']]);

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Incorrect OTP'
    ]);

    exit;
}


/*
 * OTP is valid.
 */
$stmt = $pdo->prepare(
    'UPDATE admin_otp_codes
     SET used_at = NOW()
     WHERE id = ?'
);

$stmt->execute([(int) $otpRecord['id']]);


/*
 * Prevent session fixation.
 */
session_regenerate_id(true);


/*
 * Establish authenticated admin session.
 */
$_SESSION['admin_user_id'] = (int) $adminId;
$_SESSION['admin_user_type'] = 'admin';

unset(
    $_SESSION['pending_admin_id'],
    $_SESSION['pending_admin_email'],
    $_SESSION['admin_2fa_pending']
);


/*
 * Get admin information.
 */
$stmt = $pdo->prepare(
    'SELECT id, email, first_name, last_name
     FROM admin_users
     WHERE id = ?
     AND is_active = 1
     LIMIT 1'
);

$stmt->execute([(int) $adminId]);

$admin = $stmt->fetch();

if (!$admin) {
    session_destroy();

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Administrator account is unavailable'
    ]);

    exit;
}


/*
 * Update last login time.
 */
$stmt = $pdo->prepare(
    'UPDATE admin_users
     SET last_login_at = NOW()
     WHERE id = ?'
);

$stmt->execute([(int) $adminId]);

$stmt = $pdo->prepare(
    'INSERT INTO audit_logs
    (
        admin_user_id,
        admin_email,
        action,
        module,
        record_type,
        record_id,
        description,
        ip_address,
        user_agent
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$stmt->execute([
    (int) $adminId,
    $admin['email'],
    'LOGIN',
    'AUTH',
    'ADMIN_USER',
    (int) $adminId,
    'Administrator completed 2FA login',
    $_SERVER['REMOTE_ADDR'] ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null
]);

echo json_encode([
    'success' => true,
    'message' => 'Admin login successful',
    'admin' => [
        'id' => (int) $admin['id'],
        'email' => $admin['email'],
        'first_name' => $admin['first_name'],
        'last_name' => $admin['last_name']
    ]
]);