<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$adminId = (int)($_SESSION['admin_user_id'] ?? 0);

if ($adminId > 0) {
    try {
        $stmt = $pdo->prepare('SELECT email FROM admin_users WHERE id = ? LIMIT 1');
        $stmt->execute([$adminId]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin) {
            $stmt = $pdo->prepare(
                'INSERT INTO audit_logs
                 (admin_user_id, admin_email, action, module, record_type, record_id, description, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $adminId,
                $admin['email'],
                'LOGOUT',
                'AUTH',
                'ADMIN_USER',
                $adminId,
                'Administrator logged out',
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
            ]);
        }
    } catch (Throwable $e) {
        error_log('Admin logout audit error: ' . $e->getMessage());
    }
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}
session_destroy();

adminJsonResponse(['success' => true, 'message' => 'Logged out successfully']);
