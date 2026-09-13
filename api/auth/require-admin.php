<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

$adminId=(int)($_SESSION['admin_user_id']??0);
$isAdmin=($_SESSION['admin_user_type']??'')==='admin';
$twoFactorVerified=($_SESSION['admin_2fa_verified']??false)===true;

if ($adminId<=0 || !$isAdmin || !$twoFactorVerified) {
    jsonResponse(['success'=>false,'message'=>'Administrator authentication required'],401);
}

$stmt=$pdo->prepare('SELECT id,is_active FROM admin_users WHERE id=? LIMIT 1');
$stmt->execute([$adminId]);
$admin=$stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || !$admin['is_active']) {
    $_SESSION=[];
    session_destroy();
    jsonResponse(['success'=>false,'message'=>'Administrator account is unavailable'],401);
}
