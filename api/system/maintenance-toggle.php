<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
requireAdmin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$data=adminRequestJson();
$enabled=!empty($data['enabled']);
try {
    $stmt=$pdo->prepare("INSERT INTO system_settings (setting_key,setting_value) VALUES ('maintenance_mode',?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)");
    $stmt->execute([$enabled?'1':'0']);
    adminJsonResponse(['success'=>true,'maintenance_mode'=>$enabled,'message'=>$enabled?'Maintenance mode enabled.':'Maintenance mode disabled.']);
} catch(Throwable $e) { error_log('Maintenance toggle error: '.$e->getMessage()); adminJsonResponse(['success'=>false,'message'=>'Unable to change maintenance mode'],500); }
