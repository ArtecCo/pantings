<?php

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

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

$stmt = $pdo->prepare(
    'SELECT id, email, first_name, last_name, is_active, last_login_at
     FROM admin_users
     WHERE id = ?
     LIMIT 1'
);

$stmt->execute([(int) $_SESSION['admin_user_id']]);

$admin = $stmt->fetch();

if (!$admin || !$admin['is_active']) {
    session_destroy();

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Administrator account is unavailable'
    ]);

    exit;
}


/*
 * Get assigned roles.
 */
$stmt = $pdo->prepare(
    'SELECT r.id, r.name
     FROM roles r
     INNER JOIN admin_user_roles aur
         ON aur.role_id = r.id
     WHERE aur.admin_user_id = ?
     ORDER BY r.name'
);

$stmt->execute([(int) $admin['id']]);

$roles = $stmt->fetchAll();


/*
 * Get permissions through assigned roles.
 */
$stmt = $pdo->prepare(
    'SELECT DISTINCT p.name
     FROM permissions p
     INNER JOIN role_permissions rp
         ON rp.permission_id = p.id
     INNER JOIN admin_user_roles aur
         ON aur.role_id = rp.role_id
     WHERE aur.admin_user_id = ?
     ORDER BY p.name'
);

$stmt->execute([(int) $admin['id']]);

$permissions = array_column(
    $stmt->fetchAll(),
    'name'
);


echo json_encode([
    'success' => true,
    'admin' => [
        'id' => (int) $admin['id'],
        'email' => $admin['email'],
        'first_name' => $admin['first_name'],
        'last_name' => $admin['last_name'],
        'last_login_at' => $admin['last_login_at'],
        'roles' => $roles,
        'permissions' => $permissions
    ]
]);