<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$data=requestJson();
$otp=preg_replace('/\D+/','',(string)($data['otp']??''));
$adminId=(int)($_SESSION['admin_pending_user_id']??0);

if ($adminId<=0 || empty($_SESSION['admin_otp_required'])) {
    jsonResponse(['success'=>false,'message'=>'Your login session has expired. Please sign in again.'],401);
}
if (!preg_match('/^\d{6}$/',$otp)) {
    jsonResponse(['success'=>false,'message'=>'Enter the 6-digit verification code.'],422);
}

try {
    $stmt=$pdo->prepare(
        'SELECT id,otp_hash,expires_at FROM admin_otp_codes
         WHERE admin_user_id=? AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1'
    );
    $stmt->execute([$adminId]);
    $record=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record || strtotime((string)$record['expires_at'])<time() ||
        !password_verify($otp,(string)$record['otp_hash'])) {
        jsonResponse(['success'=>false,'message'=>'Invalid or expired verification code.'],401);
    }

    $pdo->prepare('UPDATE admin_otp_codes SET used_at=NOW() WHERE id=?')
        ->execute([(int)$record['id']]);

    $adminStmt=$pdo->prepare('SELECT id,email,is_active FROM admin_users WHERE id=? LIMIT 1');
    $adminStmt->execute([$adminId]);
    $admin=$adminStmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !$admin['is_active']) {
        $_SESSION=[];
        session_destroy();
        jsonResponse(['success'=>false,'message'=>'Administrator account is unavailable.'],401);
    }

    session_regenerate_id(true);
    unset($_SESSION['user_id'],$_SESSION['user_type'],$_SESSION['user_email'],$_SESSION['user_authenticated_at']);
    $_SESSION['admin_user_id']=(int)$admin['id'];
    $_SESSION['admin_user_type']='admin';
    $_SESSION['admin_email']=$admin['email'];
    $_SESSION['admin_2fa_verified']=true;
    $_SESSION['admin_authenticated_at']=time();
    unset($_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);

    jsonResponse(['success'=>true,'authenticated'=>true,'requires_otp'=>false,
        'admin'=>['id'=>(int)$admin['id'],'email'=>$admin['email']]]);
} catch (Throwable $e) {
    error_log('ARAmane admin OTP: '.$e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Unable to verify the code right now.'],500);
}
