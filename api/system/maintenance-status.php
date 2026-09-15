<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
try {
    $stmt=$pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key=? LIMIT 1');
    $stmt->execute(['maintenance_mode']);
    $row=$stmt->fetch(PDO::FETCH_ASSOC);
    $enabled=in_array(strtolower(trim((string)($row['setting_value']??'0'))),['1','true','on','yes'],true);
    jsonResponse(['success'=>true,'maintenance_mode'=>$enabled]);
} catch(Throwable $e) {
    error_log('Maintenance status error: '.$e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Unable to read maintenance mode'],500);
}
