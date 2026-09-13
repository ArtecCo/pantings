<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$adminId=(int)($_SESSION['admin_user_id']??0);
$twoFactorVerified=($_SESSION['admin_2fa_verified']??false)===true;

if ($adminId<=0 || !$twoFactorVerified) {
    jsonResponse([
        'success'=>false,
        'authenticated'=>false,
        'message'=>'Administrator authentication required'
    ],401);
}

try {
    $stmt=$pdo->prepare(
        'SELECT id,email,first_name,last_name,is_active,last_login_at
         FROM admin_users
         WHERE id=?
         LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $admin=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !$admin['is_active']) {
        $_SESSION=[];
        session_destroy();
        jsonResponse([
            'success'=>false,
            'authenticated'=>false,
            'message'=>'Administrator account is unavailable'
        ],401);
    }

    jsonResponse([
        'success'=>true,
        'authenticated'=>true,
        'two_factor_verified'=>true,
        'admin'=>[
            'id'=>(int)$admin['id'],
            'email'=>$admin['email'],
            'first_name'=>$admin['first_name'],
            'last_name'=>$admin['last_name'],
            'last_login_at'=>$admin['last_login_at']
        ]
    ]);
} catch (Throwable $e) {
    error_log('Admin session check: '.$e->getMessage());
    jsonResponse(['success'=>false,'authenticated'=>false,'message'=>'Unable to check administrator session'],500);
}
