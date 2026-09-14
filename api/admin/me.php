<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$adminId = requireAdmin();

try {
    $stmt = $pdo->prepare(
        'SELECT id, email, first_name, last_name, is_active, last_login_at
         FROM admin_users
         WHERE id = ?
         LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $admin = $stmt->fetch();

    if (!$admin || !(int)$admin['is_active']) {
        unset($_SESSION['admin_user_id'], $_SESSION['admin_user_type']);
        adminJsonResponse(['success' => false, 'message' => 'Administrator account is unavailable'], 401);
    }

    $stmt = $pdo->prepare(
        'SELECT r.id, r.name
         FROM roles r
         INNER JOIN admin_user_roles aur ON aur.role_id = r.id
         WHERE aur.admin_user_id = ?
         ORDER BY r.name'
    );
    $stmt->execute([$adminId]);
    $roles = $stmt->fetchAll();

    $stmt = $pdo->prepare(
        'SELECT DISTINCT p.name
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.id
         INNER JOIN admin_user_roles aur ON aur.role_id = rp.role_id
         WHERE aur.admin_user_id = ?
         ORDER BY p.name'
    );
    $stmt->execute([$adminId]);
    $permissions = array_column($stmt->fetchAll(), 'name');

    adminJsonResponse([
        'success' => true,
        'admin' => [
            'id' => (int)$admin['id'],
            'email' => $admin['email'],
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name'],
            'last_login_at' => $admin['last_login_at'],
            'roles' => $roles,
            'permissions' => $permissions
        ]
    ]);
} catch (Throwable $e) {
    error_log('Admin session lookup error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load administrator session'], 500);
}
