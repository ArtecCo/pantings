<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

$adminId = requireAdmin();

$stmt = $pdo->prepare('SELECT id,is_active FROM admin_users WHERE id=? LIMIT 1');
$stmt->execute([$adminId]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || !(int)$admin['is_active']) {
    $_SESSION = [];
    session_destroy();
    adminJsonResponse(['success'=>false,'message'=>'Administrator account is unavailable'],401);
}
