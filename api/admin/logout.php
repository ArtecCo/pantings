<?php

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

$adminId = $_SESSION['admin_user_id'] ?? null;

if ($adminId) {

    $stmt = $pdo->prepare(
        'SELECT email
         FROM admin_users
         WHERE id = ?
         LIMIT 1'
    );

    $stmt->execute([(int) $adminId]);

    $admin = $stmt->fetch();

    if ($admin) {

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
            'LOGOUT',
            'AUTH',
            'ADMIN_USER',
            (int) $adminId,
            'Administrator logged out',
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}


/*
 * Destroy the authenticated session.
 */
$_SESSION = [];

if (ini_get('session.use_cookies')) {

    $params = session_get_cookie_params();

    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);