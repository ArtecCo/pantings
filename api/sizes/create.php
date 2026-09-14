<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$input=adminRequestJson();
$name=trim((string)($input['name']??''));$width=$input['width']??null;$height=$input['height']??null;$unit=trim((string)($input['unit']??'in'));
if($name==='')adminJsonResponse(['success'=>false,'message'=>'Display name is required'],400);
if($width===null||$height===null||$width===''||$height===''||!is_numeric($width)||!is_numeric($height)||(float)$width<=0||(float)$height<=0)adminJsonResponse(['success'=>false,'message'=>'Width and height must be valid positive numbers'],400);
if(!in_array($unit,['in','cm'],true))adminJsonResponse(['success'=>false,'message'=>'Invalid unit'],400);
try{
    $check=$pdo->prepare('SELECT id FROM default_sizes WHERE width=? AND height=? AND unit=? LIMIT 1');$check->execute([$width,$height,$unit]);if($check->fetch())adminJsonResponse(['success'=>false,'message'=>'A default size with these dimensions already exists'],409);
    $stmt=$pdo->prepare('INSERT INTO default_sizes (name,width,height,unit,is_active) VALUES (?,?,?,?,1)');$stmt->execute([$name,$width,$height,$unit]);$sizeId=(int)$pdo->lastInsertId();
    $adminId=(int)$_SESSION['admin_user_id'];$adminStmt=$pdo->prepare('SELECT email FROM admin_users WHERE id=? LIMIT 1');$adminStmt->execute([$adminId]);$admin=$adminStmt->fetch(PDO::FETCH_ASSOC);
    $audit=$pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?)');$audit->execute([$adminId,$admin['email']??null,'CREATE','catalogue','default_size',$sizeId,$_SERVER['REMOTE_ADDR']??null,$_SERVER['HTTP_USER_AGENT']??null]);
    adminJsonResponse(['success'=>true,'message'=>'Default size created successfully','size_id'=>$sizeId]);
}catch(Throwable $e){error_log('Default size create error: '.$e->getMessage());adminJsonResponse(['success'=>false,'message'=>'Unable to create default size'],500);}
