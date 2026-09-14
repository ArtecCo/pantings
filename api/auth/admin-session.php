<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$adminId = requireAdmin();

try {
    $stmt = $pdo->prepare(
        'SELECT id, email, first_name, last_name, is_active, last_login_at
         FROM admin_users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !$admin['is_active']) {
        $_SESSION = [];
        session_destroy();
        adminJsonResponse(['success' => false, 'authenticated' => false, 'message' => 'Administrator account is unavailable'], 401);
    }

    adminJsonResponse([
        'success' => true,
        'authenticated' => true,
        'two_factor_verified' => true,
        'admin' => [
            'id' => (int)$admin['id'],
            'email' => $admin['email'],
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name'],
            'last_login_at' => $admin['last_login_at'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('Admin session check: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'authenticated' => false, 'message' => 'Unable to check administrator session'], 500);
}
