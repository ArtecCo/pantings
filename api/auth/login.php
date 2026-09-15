<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mail/index.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$data=adminRequestJson();
$email=strtolower(trim((string)($data['email']??'')));
$password=(string)($data['password']??'');

if (!filter_var($email,FILTER_VALIDATE_EMAIL) || $password==='') {
    adminJsonResponse(['success'=>false,'message'=>'Email and password are required.'],422);
}

try {
    $stmt=$pdo->prepare('SELECT id,email,password_hash,is_active FROM admin_users WHERE LOWER(email)=? LIMIT 1');
    $stmt->execute([$email]);
    $admin=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !(int)$admin['is_active'] || empty($admin['password_hash']) || !password_verify($password,$admin['password_hash'])) {
        usleep(250000);
        adminJsonResponse(['success'=>false,'message'=>'Invalid email or password.'],401);
    }

    $setting=$pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key='2fa_enabled' LIMIT 1");
    $setting->execute();
    $twoFa=((string)$setting->fetchColumn()==='1');

    if (!$twoFa) {
        session_regenerate_id(true);
        unset($_SESSION['user_id'],$_SESSION['user_type'],$_SESSION['pending_admin_id'],$_SESSION['pending_admin_email'],$_SESSION['admin_2fa_pending'],$_SESSION['admin_otp_requested_at']);
        $_SESSION['admin_user_id']=(int)$admin['id'];
        $_SESSION['admin_user_type']='admin';
        $_SESSION['admin_email']=$admin['email'];
        $_SESSION['admin_authenticated_at']=time();
        $_SESSION['admin_2fa_verified']=true;
        unset($_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);
        $pdo->prepare('UPDATE admin_users SET last_login_at=NOW() WHERE id=?')->execute([(int)$admin['id']]);
        adminJsonResponse(['success'=>true,'authenticated'=>true,'requires_otp'=>false,'admin'=>['id'=>(int)$admin['id'],'email'=>$admin['email']]]);
    }

    $pdo->prepare('UPDATE admin_otp_codes SET used_at=NOW() WHERE admin_user_id=? AND used_at IS NULL')->execute([(int)$admin['id']]);
    $otp=(string)random_int(100000,999999);
    $hash=hash('sha256',$otp);
    $insert=$pdo->prepare('INSERT INTO admin_otp_codes (admin_user_id,otp_hash,expires_at,used_at,created_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 10 MINUTE),NULL,NOW())');
    $insert->execute([(int)$admin['id'],$hash]);

    $mailSent=sendAdminOtp((string)$admin['email'],$otp);
    if (!$mailSent) {
        $pdo->prepare('UPDATE admin_otp_codes SET used_at=NOW() WHERE admin_user_id=? AND otp_hash=? AND used_at IS NULL')->execute([(int)$admin['id'],$hash]);
        adminJsonResponse(['success'=>false,'message'=>'Unable to send the administrator verification code.'],500);
    }

    session_regenerate_id(true);
    unset($_SESSION['user_id'],$_SESSION['user_type'],$_SESSION['admin_user_id'],$_SESSION['admin_user_type'],$_SESSION['admin_email'],$_SESSION['admin_authenticated_at'],$_SESSION['admin_2fa_verified']);
    $_SESSION['pending_admin_id']=(int)$admin['id'];
    $_SESSION['pending_admin_email']=$admin['email'];
    $_SESSION['admin_2fa_pending']=true;
    $_SESSION['admin_otp_requested_at']=time();

    adminJsonResponse(['success'=>true,'authenticated'=>false,'requires_otp'=>true,'message'=>'A verification code has been sent to your administrator email.']);
} catch (Throwable $e) {
    error_log('ARAmane admin login: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>'Unable to sign in right now.'],500);
}
