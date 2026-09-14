<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
$isAdmin=isset($_SESSION['admin_user_id'])&&($_SESSION['admin_user_type']??'')==='admin'&&($_SESSION['admin_2fa_verified']??false)===true;
if($_SERVER['REQUEST_METHOD']!=='GET')adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
try{$sql='SELECT id,name,slug,description,is_active,created_at,updated_at FROM categories';if(!$isAdmin)$sql.=' WHERE is_active=1';$sql.=' ORDER BY name ASC';$stmt=$pdo->query($sql);adminJsonResponse(['success'=>true,'categories'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);}catch(Throwable $e){error_log('Categories list error: '.$e->getMessage());adminJsonResponse(['success'=>false,'message'=>'Unable to load categories'],500);}
