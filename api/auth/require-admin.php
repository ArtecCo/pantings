<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';

$verified = filter_var($_SESSION['admin_2fa_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);
if (!isset($_SESSION['admin_user_id'])
    || ($_SESSION['admin_user_type'] ?? '') !== 'admin'
    || !$verified) {
    adminJsonResponse(['success' => false, 'message' => 'Admin authentication required'], 401);
}

$adminId = (int)$_SESSION['admin_user_id'];
$stmt = $pdo->prepare('SELECT id,is_active FROM admin_users WHERE id=? LIMIT 1');
$stmt->execute([$adminId]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$admin || !(int)$admin['is_active']) {
    $_SESSION = [];
    session_destroy();
    adminJsonResponse(['success'=>false,'message'=>'Administrator account is unavailable'],401);
}
return $adminId;
