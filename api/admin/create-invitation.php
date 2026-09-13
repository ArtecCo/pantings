<?php

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');


/*
 * Only authenticated admins can access this endpoint.
 */
if (
    !isset($_SESSION['admin_user_id']) ||
    $_SESSION['admin_user_type'] !== 'admin'
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);

    exit;
}


$adminId = (int) $_SESSION['admin_user_id'];


/*
 * Verify that this admin has the Super Admin role.
 */
$stmt = $pdo->prepare(
    'SELECT 1
     FROM admin_user_roles aur
     INNER JOIN roles r
         ON r.id = aur.role_id
     WHERE aur.admin_user_id = ?
     AND r.name = ?
     LIMIT 1'
);

$stmt->execute([
    $adminId,
    'Super Admin'
]);

if (!$stmt->fetch()) {
    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'Super Admin permission required'
    ]);

    exit;
}


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

$email = strtolower(
    trim($data['email'] ?? '')
);

$roleId = isset($data['role_id'])
    ? (int) $data['role_id']
    : null;

$expiresHours = isset($data['expires_hours'])
    ? (int) $data['expires_hours']
    : 48;


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Valid email address is required'
    ]);

    exit;
}


if ($expiresHours < 1 || $expiresHours > 168) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invitation expiry must be between 1 and 168 hours'
    ]);

    exit;
}


/*
 * Do not allow an invitation to be created
 * for an existing admin.
 */
$stmt = $pdo->prepare(
    'SELECT id
     FROM admin_users
     WHERE email = ?
     LIMIT 1'
);

$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);

    echo json_encode([
        'success' => false,
        'message' => 'This email already belongs to an administrator'
    ]);

    exit;
}


/*
 * Verify the selected role.
 */
if ($roleId !== null) {

    $stmt = $pdo->prepare(
        'SELECT id
         FROM roles
         WHERE id = ?
         LIMIT 1'
    );

    $stmt->execute([$roleId]);

    if (!$stmt->fetch()) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid role'
        ]);

        exit;
    }
}


/*
 * Generate secure one-time token.
 */
$token = bin2hex(
    random_bytes(32)
);

$tokenHash = hash(
    'sha256',
    $token
);

$expiresAt = date(
    'Y-m-d H:i:s',
    time() + ($expiresHours * 60 * 60)
);


/*
 * Invalidate previous unused invitations
 * for this email.
 */
$stmt = $pdo->prepare(
    'UPDATE admin_invitations
     SET used_at = NOW()
     WHERE email = ?
     AND used_at IS NULL'
);

$stmt->execute([$email]);


/*
 * Store invitation.
 */
$stmt = $pdo->prepare(
    'INSERT INTO admin_invitations
    (
        email,
        token_hash,
        invited_by_admin_id,
        role_id,
        expires_at
    )
    VALUES (?, ?, ?, ?, ?)'
);

$stmt->execute([
    $email,
    $tokenHash,
    $adminId,
    $roleId,
    $expiresAt
]);


/*
 * Local development URL.
 *
 * This will later become:
 *
 * https://admin.yourdomain.com/register?token=...
 */
$invitationUrl =
    'http://localhost/paintings/admin/register?token=' .
    urlencode($token);


/*
 * Audit the invitation creation.
 */
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
        new_value,
        ip_address,
        user_agent
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$stmt->execute([
    $adminId,
    $_SESSION['admin_user_email'] ?? null,
    'CREATE',
    'ADMIN_INVITATIONS',
    'ADMIN_INVITATION',
    $pdo->lastInsertId(),
    'Created administrator invitation',
    json_encode([
        'email' => $email,
        'role_id' => $roleId,
        'expires_at' => $expiresAt
    ]),
    $_SERVER['REMOTE_ADDR'] ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null
]);


/*
 * For local development we return the URL.
 *
 * Later this URL will be sent using PHPMailer
 * and won't need to be returned by the production API.
 */
echo json_encode([
    'success' => true,
    'message' => 'Invitation created successfully',
    'invitation' => [
        'email' => $email,
        'expires_at' => $expiresAt,
        'url' => $invitationUrl
    ]
]);