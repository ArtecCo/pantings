<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if($_SERVER['REQUEST_METHOD']!=='POST') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$data=requestJson(); $token=trim((string)($data['token']??'')); $password=(string)($data['password']??'');
if($token===''||strlen($password)<8) jsonResponse(['success'=>false,'message'=>'A valid reset token and password of at least 8 characters are required.'],422);
try{
 $stmt=$pdo->prepare('SELECT id,account_type,account_id,expires_at,used_at FROM password_reset_tokens WHERE token_hash=? LIMIT 1'); $stmt->execute([hash('sha256',$token)]); $reset=$stmt->fetch(PDO::FETCH_ASSOC);
 if(!$reset) jsonResponse(['success'=>false,'message'=>'Invalid password reset link.'],404);
 if($reset['used_at']!==null) jsonResponse(['success'=>false,'message'=>'This password reset link has already been used.'],410);
 if(strtotime($reset['expires_at'])<time()) jsonResponse(['success'=>false,'message'=>'This password reset link has expired.'],410);
 $table=$reset['account_type']==='admin'?'admin_users':'users';
 $pdo->beginTransaction();
 $stmt=$pdo->prepare("UPDATE {$table} SET password_hash=? WHERE id=? AND is_active=1"); $stmt->execute([password_hash($password,PASSWORD_DEFAULT),(int)$reset['account_id']]);
 if($stmt->rowCount()!==1) throw new RuntimeException('Account unavailable');
 $stmt=$pdo->prepare('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=? AND used_at IS NULL'); $stmt->execute([(int)$reset['id']]);
 if($stmt->rowCount()!==1) throw new RuntimeException('Reset token could not be consumed');
 $pdo->commit();
 jsonResponse(['success'=>true,'message'=>'Your password has been reset successfully.']);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('Password reset: '.$e->getMessage());jsonResponse(['success'=>false,'message'=>'Unable to reset the password right now.'],500);}
