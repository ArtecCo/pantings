<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$data=requestJson();
$email=strtolower(trim((string)($data['email']??'')));
if (!filter_var($email,FILTER_VALIDATE_EMAIL)) jsonResponse(['success'=>false,'message'=>'A valid email address is required.'],422);

try {
    $stmt=$pdo->prepare('SELECT id, first_name, email FROM users WHERE email=? AND is_active=1 LIMIT 1');
    $stmt->execute([$email]);
    $account=$stmt->fetch(PDO::FETCH_ASSOC);
    if ($account) {
        $token=bin2hex(random_bytes(32));
        $hash=hash('sha256',$token);
        $expires=date('Y-m-d H:i:s',time()+3600);
        $pdo->prepare("UPDATE password_reset_tokens SET used_at=NOW() WHERE account_type='customer' AND account_id=? AND used_at IS NULL")->execute([(int)$account['id']]);
        $pdo->prepare('INSERT INTO password_reset_tokens (account_type,account_id,email,token_hash,expires_at) VALUES (?,?,?,?,?)')->execute(['customer',(int)$account['id'],$email,$hash,$expires]);
        $base=trim((string)(getenv('CUSTOMER_PASSWORD_RESET_URL')?:'http://localhost:5173/reset-password'));
        $url=rtrim($base,'/').'?token='.urlencode($token);
        require_once __DIR__.'/../mail/Mailer.php'; require_once __DIR__.'/../mail/Templates.php';
        $template=passwordResetEmail($account['first_name']??'Customer',$url,'customer');
        sendMail($email,$account['first_name']??'Customer',$template['subject'],$template['html']);
    }
    jsonResponse(['success'=>true,'message'=>'If an account exists for that email, a password reset link has been sent.']);
} catch(Throwable $e) {
    error_log('Customer password reset request: '.$e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Unable to process the password reset request right now.'],500);
}
