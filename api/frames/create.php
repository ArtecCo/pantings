<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$data=adminRequestJson();
$name=trim((string)($data['name']??''));
$description=trim((string)($data['description']??''));
if($name==='') adminJsonResponse(['success'=>false,'message'=>'Frame name is required'],400);

try {
    $check=$pdo->prepare('SELECT id FROM frames WHERE name=? LIMIT 1');
    $check->execute([$name]);
    if($check->fetch()) adminJsonResponse(['success'=>false,'message'=>'A frame with this name already exists'],409);

    $stmt=$pdo->prepare('INSERT INTO frames (name,description,is_active) VALUES (?, ?, 1)');
    $stmt->execute([$name,$description!==''?$description:null]);
    $frameId=(int)$pdo->lastInsertId();

    $adminId=(int)$_SESSION['admin_user_id'];
    $adminStmt=$pdo->prepare('SELECT email FROM admin_users WHERE id=? LIMIT 1');
    $adminStmt->execute([$adminId]);
    $admin=$adminStmt->fetch(PDO::FETCH_ASSOC);
    $audit=$pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,ip_address,user_agent) VALUES (?,? ,?,?,?,?,?,?)');
    $audit->execute([$adminId,$admin['email']??null,'CREATE','catalogue','frame',$frameId,$_SERVER['REMOTE_ADDR']??null,$_SERVER['HTTP_USER_AGENT']??null]);

    adminJsonResponse(['success'=>true,'message'=>'Frame added successfully','frame_id'=>$frameId]);
} catch(Throwable $e) {
    error_log('Frame create error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>'Unable to create frame'],500);
}
