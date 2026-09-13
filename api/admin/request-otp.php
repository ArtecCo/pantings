<?php

require_once __DIR__ . '/../config/database.php';

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

$data = json_decode(
    file_get_contents('php://input'),
    true
);

$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$password) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);

    exit;
}


/*
 * Find active administrator.
 */
$stmt = $pdo->prepare(
    'SELECT
        id,
        email,
        password_hash,
        first_name,
        last_name,
        is_active
     FROM admin_users
     WHERE email = ?
     LIMIT 1'
);

$stmt->execute([$email]);

$admin = $stmt->fetch();


/*
 * Verify account and password.
 */
if (
    !$admin ||
    !$admin['is_active'] ||
    !$admin['password_hash'] ||
    !password_verify($password, $admin['password_hash'])
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);

    exit;
}


/*
 * Remove previous unused OTPs.
 */
$stmt = $pdo->prepare(
    'UPDATE admin_otp_codes
     SET used_at = NOW()
     WHERE admin_user_id = ?
     AND used_at IS NULL'
);

$stmt->execute([
    (int) $admin['id']
]);


/*
 * Generate a six-digit OTP.
 */
$otp = (string) random_int(
    100000,
    999999
);

$otpHash = hash(
    'sha256',
    $otp
);

$expiresAt = date(
    'Y-m-d H:i:s',
    time() + (10 * 60)
);


/*
 * Store only the OTP hash.
 */
$stmt = $pdo->prepare(
    'INSERT INTO admin_otp_codes
    (
        admin_user_id,
        otp_hash,
        expires_at
    )
    VALUES (?, ?, ?)'
);

$stmt->execute([
    (int) $admin['id'],
    $otpHash,
    $expiresAt
]);


/*
 * Establish temporary 2FA state.
 *
 * The admin is NOT fully authenticated yet.
 */
session_regenerate_id(true);

$_SESSION['pending_admin_id'] = (int) $admin['id'];
$_SESSION['pending_admin_email'] = $admin['email'];
$_SESSION['admin_2fa_pending'] = true;


/*
 * LOCAL DEVELOPMENT ONLY.
 *
 * This will be removed when PHPMailer is configured.
 */
echo json_encode([
    'success' => true,
    'message' => 'Password verified. OTP generated.',
    'expires_at' => $expiresAt,
    'development_otp' => $otp
]);