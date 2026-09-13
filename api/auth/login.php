<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$data=requestJson();
$email=strtolower(trim((string)($data['email']??'')));
$password=(string)($data['password']??'');

if (!filter_var($email,FILTER_VALIDATE_EMAIL) || $password==='') {
    jsonResponse(['success'=>false,'message'=>'Email and password are required.'],422);
}

try {
    $stmt=$pdo->prepare('SELECT id,email,password_hash,is_active FROM admin_users WHERE LOWER(email)=? LIMIT 1');
    $stmt->execute([$email]);
    $admin=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !$admin['is_active'] || empty($admin['password_hash']) || !password_verify($password,$admin['password_hash'])) {
        usleep(250000);
        jsonResponse(['success'=>false,'message'=>'Invalid email or password.'],401);
    }

    $setting=$pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key='2fa_enabled' LIMIT 1");
    $setting->execute();
    $twoFa=((string)$setting->fetchColumn()==='1');

    if (!$twoFa) {
        session_regenerate_id(true);
        $_SESSION['admin_2fa_verified'] = true;
        $_SESSION['admin_user_id']=(int)$admin['id'];
        $_SESSION['admin_user_type']='admin';
        $_SESSION['admin_email']=$admin['email'];
        $_SESSION['admin_authenticated_at']=time();
        unset($_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);

        jsonResponse(['success'=>true,'authenticated'=>true,'requires_otp'=>false,
            'admin'=>['id'=>(int)$admin['id'],'email'=>$admin['email']]]);
    }

    $pdo->prepare('UPDATE admin_otp_codes SET used_at=NOW() WHERE admin_user_id=? AND used_at IS NULL')
        ->execute([(int)$admin['id']]);

    $otp=(string)random_int(100000,999999);
    $hash=password_hash($otp,PASSWORD_DEFAULT);

    $insert=$pdo->prepare(
        'INSERT INTO admin_otp_codes (admin_user_id,otp_hash,expires_at,used_at,created_at)
         VALUES (?,?,DATE_ADD(NOW(),INTERVAL 10 MINUTE),NULL,NOW())'
    );
    $insert->execute([(int)$admin['id'],$hash]);

    unset($_SESSION['admin_user_id'],$_SESSION['admin_user_type'],$_SESSION['admin_email'],$_SESSION['admin_authenticated_at'],$_SESSION['admin_2fa_verified']);
    $_SESSION['admin_pending_user_id']=(int)$admin['id'];
    $_SESSION['admin_pending_email']=$admin['email'];
    $_SESSION['admin_otp_required']=true;

    require_once __DIR__ . '/../emails/send-admin-otp.php';
    if (!sendAdminOtp($admin['email'],$otp)) {
        $pdo->prepare('UPDATE admin_otp_codes SET used_at=NOW() WHERE admin_user_id=? AND used_at IS NULL')
            ->execute([(int)$admin['id']]);
        unset($_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);
        jsonResponse(['success'=>false,'message'=>'Unable to send the verification code. Please try again.'],500);
    }

    jsonResponse(['success'=>true,'authenticated'=>false,'requires_otp'=>true,
        'message'=>'A verification code has been sent to your administrator email.']);
} catch (Throwable $e) {
    error_log('ARAmane admin login: '.$e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Unable to sign in right now.'],500);
}
