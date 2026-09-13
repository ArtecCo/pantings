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

$data = json_decode(
    file_get_contents('php://input'),
    true
);

$token = trim($data['token'] ?? '');
$firstName = trim($data['first_name'] ?? '');
$lastName = trim($data['last_name'] ?? '');
$password = $data['password'] ?? '';


/*
 * Validate basic input.
 */
if (!$token || !$firstName || !$password) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invitation token, first name and password are required'
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


/*
 * Hash the supplied token.
 */
$tokenHash = hash(
    'sha256',
    $token
);


/*
 * Find the invitation.
 */
$stmt = $pdo->prepare(
    'SELECT
        id,
        email,
        role_id,
        expires_at,
        used_at
     FROM admin_invitations
     WHERE token_hash = ?
     LIMIT 1'
);

$stmt->execute([$tokenHash]);

$invitation = $stmt->fetch();


if (!$invitation) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid invitation'
    ]);

    exit;
}


/*
 * One-time-use check.
 */
if ($invitation['used_at'] !== null) {
    http_response_code(410);

    echo json_encode([
        'success' => false,
        'message' => 'This invitation has already been used'
    ]);

    exit;
}


/*
 * Expiry check.
 */
if (strtotime($invitation['expires_at']) < time()) {
    http_response_code(410);

    echo json_encode([
        'success' => false,
        'message' => 'This invitation has expired'
    ]);

    exit;
}


/*
 * Make sure the email hasn't already become an admin.
 */
$stmt = $pdo->prepare(
    'SELECT id
     FROM admin_users
     WHERE email = ?
     LIMIT 1'
);

$stmt->execute([
    $invitation['email']
]);

if ($stmt->fetch()) {
    http_response_code(409);

    echo json_encode([
        'success' => false,
        'message' => 'An administrator already exists for this email'
    ]);

    exit;
}


/*
 * Create the administrator and consume
 * the invitation atomically.
 */
try {

    $pdo->beginTransaction();


    /*
     * Create admin account.
     */
    $stmt = $pdo->prepare(
        'INSERT INTO admin_users
        (
            email,
            password_hash,
            first_name,
            last_name,
            is_active
        )
        VALUES (?,?, ?, ?, TRUE)'
    );

    $stmt->execute([
        $invitation['email'],
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName ?: null
    ]);

    $adminId = (int) $pdo->lastInsertId();


    /*
     * Assign the role from the invitation.
     */
    if ($invitation['role_id'] !== null) {

        $stmt = $pdo->prepare(
            'INSERT INTO admin_user_roles
            (
                admin_user_id,
                role_id
            )
            VALUES (?, ?)'
        );

        $stmt->execute([
            $adminId,
            (int) $invitation['role_id']
        ]);
    }


    /*
     * Mark invitation as permanently used.
     */
    $stmt = $pdo->prepare(
        'UPDATE admin_invitations
         SET used_at = NOW()
         WHERE id = ?
         AND used_at IS NULL'
    );

    $stmt->execute([
        (int) $invitation['id']
    ]);


    /*
     * Make sure exactly one invitation was consumed.
     */
    if ($stmt->rowCount() !== 1) {
        throw new Exception(
            'Invitation could not be consumed'
        );
    }


    /*
     * Audit registration.
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
        $invitation['email'],
        'CREATE',
        'ADMIN_USERS',
        'ADMIN_USER',
        $adminId,
        'Administrator account created using invitation',
        json_encode([
            'email' => $invitation['email'],
            'role_id' => $invitation['role_id']
        ]),
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);


    $pdo->commit();


    echo json_encode([
        'success' => true,
        'message' => 'Administrator account created successfully',
        'admin' => [
            'id' => $adminId,
            'email' => $invitation['email'],
            'first_name' => $firstName,
            'last_name' => $lastName
        ]
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to create administrator account',
        // 'error' => $e->getMessage()
    ]);
}