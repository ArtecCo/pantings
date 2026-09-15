<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';
if($_SERVER['REQUEST_METHOD']!=='POST')adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$data=adminRequestJson();$token=trim((string)($data['token']??''));$firstName=trim((string)($data['first_name']??''));$lastName=trim((string)($data['last_name']??''));$password=(string)($data['password']??'');
if($token===''||$firstName===''||$password==='')adminJsonResponse(['success'=>false,'message'=>'Invitation token, first name and password are required'],400);
if(strlen($password)<8)adminJsonResponse(['success'=>false,'message'=>'Password must be at least 8 characters'],400);
try{
 $stmt=$pdo->prepare('SELECT id,email,role_id,expires_at,used_at FROM admin_invitations WHERE token_hash=? LIMIT 1');$stmt->execute([hash('sha256',$token)]);$inv=$stmt->fetch(PDO::FETCH_ASSOC);
 if(!$inv)adminJsonResponse(['success'=>false,'message'=>'Invalid invitation'],404);
 if($inv['used_at']!==null)adminJsonResponse(['success'=>false,'message'=>'This invitation has already been used'],410);
 if(strtotime($inv['expires_at'])<time())adminJsonResponse(['success'=>false,'message'=>'This invitation has expired'],410);
 $stmt=$pdo->prepare('SELECT id FROM admin_users WHERE email=? LIMIT 1');$stmt->execute([$inv['email']]);if($stmt->fetch())adminJsonResponse(['success'=>false,'message'=>'An administrator already exists for this email'],409);
 $pdo->beginTransaction();
 $stmt=$pdo->prepare('INSERT INTO admin_users (email,password_hash,first_name,last_name,is_active) VALUES (?,?,?,?,TRUE)');$stmt->execute([$inv['email'],password_hash($password,PASSWORD_DEFAULT),$firstName,$lastName?:null]);$adminId=(int)$pdo->lastInsertId();
 if($inv['role_id']!==null){$stmt=$pdo->prepare('INSERT INTO admin_user_roles (admin_user_id,role_id) VALUES (?,?)');$stmt->execute([$adminId,(int)$inv['role_id']]);}
 $stmt=$pdo->prepare('UPDATE admin_invitations SET used_at=NOW() WHERE id=? AND used_at IS NULL');$stmt->execute([(int)$inv['id']]);if($stmt->rowCount()!==1)throw new RuntimeException('Invitation could not be consumed');
 $stmt=$pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,description,new_value,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$adminId,$inv['email'],'CREATE','ADMIN_USERS','ADMIN_USER',$adminId,'Administrator account created using invitation',json_encode(['email'=>$inv['email']],JSON_UNESCAPED_SLASHES),$_SERVER['REMOTE_ADDR']??null,$_SERVER['HTTP_USER_AGENT']??null]);$pdo->commit();
 adminJsonResponse(['success'=>true,'message'=>'Administrator account created successfully','admin'=>['id'=>$adminId,'email'=>$inv['email'],'first_name'=>$firstName,'last_name'=>$lastName]]);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('Admin registration: '.$e->getMessage());adminJsonResponse(['success'=>false,'message'=>'Unable to create administrator account'],500);}
