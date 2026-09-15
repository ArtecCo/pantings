<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

$adminId = requireAdmin();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $groups = $pdo->query('SELECT id,group_key,group_name,description,is_active FROM mail_groups ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC);
        $recipientStmt = $pdo->prepare('SELECT id,mail_group_id,recipient_name,recipient_email,is_active FROM mail_group_recipients WHERE mail_group_id=? ORDER BY id ASC');
        foreach ($groups as &$group) {
            $recipientStmt->execute([(int)$group['id']]);
            $group['recipients'] = $recipientStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($group);
        adminJsonResponse(['success'=>true,'groups'=>$groups]);
    } catch (Throwable $e) {
        error_log('Mail groups load error: '.$e->getMessage());
        adminJsonResponse(['success'=>false,'message'=>'Unable to load mail groups'],500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$data=adminRequestJson();
$groupId=(int)($data['group_id']??0);
$recipients=is_array($data['recipients']??null)?$data['recipients']:null;
if($groupId<=0||$recipients===null) adminJsonResponse(['success'=>false,'message'=>'Group and recipients are required'],422);

try {
    $check=$pdo->prepare('SELECT id FROM mail_groups WHERE id=? LIMIT 1');
    $check->execute([$groupId]);
    if(!$check->fetch()) adminJsonResponse(['success'=>false,'message'=>'Mail group not found'],404);
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM mail_group_recipients WHERE mail_group_id=?')->execute([$groupId]);
    $insert=$pdo->prepare('INSERT INTO mail_group_recipients(mail_group_id,recipient_name,recipient_email,is_active) VALUES(?,?,?,1)');
    $seen=[];
    foreach($recipients as $recipient){
        if(!is_array($recipient)) continue;
        $name=trim((string)($recipient['name']??$recipient['recipient_name']??''));
        $email=strtolower(trim((string)($recipient['email']??$recipient['recipient_email']??'')));
        if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)) continue;
        if(isset($seen[$email])) continue;
        $seen[$email]=true;
        $insert->execute([$groupId,$name,$email]);
    }
    $pdo->commit();
    $pdo->prepare('INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details,created_at) VALUES(?,?,?,?,?,NOW())')->execute([$adminId,'UPDATE','MAIL_GROUP',$groupId,json_encode(['recipient_count'=>count($seen)],JSON_UNESCAPED_SLASHES)]);
    adminJsonResponse(['success'=>true,'message'=>'Mail group updated successfully','recipient_count'=>count($seen)]);
} catch(Throwable $e) {
    if($pdo->inTransaction()) $pdo->rollBack();
    error_log('Mail group update error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>'Unable to update mail group'],500);
}
