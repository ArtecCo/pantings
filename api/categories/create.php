<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$data=adminRequestJson();
$name=trim((string)($data['name']??''));
$description=trim((string)($data['description']??''));
if($name==='') adminJsonResponse(['success'=>false,'message'=>'Category name is required'],400);
$slug=trim((string)preg_replace('/[^a-z0-9]+/','-',strtolower($name)),'-');
if($slug==='')$slug='category';
$baseSlug=$slug;$counter=1;
try {
    while(true){$check=$pdo->prepare('SELECT id FROM categories WHERE slug=? LIMIT 1');$check->execute([$slug]);if(!$check->fetch())break;$slug=$baseSlug.'-'.(++$counter);}
    $stmt=$pdo->prepare('INSERT INTO categories (name,slug,description,is_active) VALUES (?,?,?,1)');
    $stmt->execute([$name,$slug,$description!==''?$description:null]);
    $categoryId=(int)$pdo->lastInsertId();
    $adminId=(int)$_SESSION['admin_user_id'];
    $adminStmt=$pdo->prepare('SELECT email FROM admin_users WHERE id=? LIMIT 1');$adminStmt->execute([$adminId]);$admin=$adminStmt->fetch(PDO::FETCH_ASSOC);
    $audit=$pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?)');
    $audit->execute([$adminId,$admin['email']??null,'CREATE','catalogue','category',$categoryId,$_SERVER['REMOTE_ADDR']??null,$_SERVER['HTTP_USER_AGENT']??null]);
    adminJsonResponse(['success'=>true,'message'=>'Category created successfully','category_id'=>$categoryId]);
} catch(Throwable $e){error_log('Category create error: '.$e->getMessage());adminJsonResponse(['success'=>false,'message'=>'Unable to create category'],500);}
