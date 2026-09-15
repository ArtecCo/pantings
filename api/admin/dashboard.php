<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
requireAdmin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
try {
    $pending=(int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status='PENDING_ACCEPTANCE'")->fetchColumn();
    $paintings=(int)$pdo->query('SELECT COUNT(*) FROM paintings')->fetchColumn();
    $customers=(int)$pdo->query('SELECT COUNT(*) FROM users WHERE user_type=\'customer\'')->fetchColumn();
    $revenue=(float)$pdo->query("SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status IN ('PAID','PROCESSING','DISPATCHED','DELIVERED')")->fetchColumn();
    adminJsonResponse(['success'=>true,'pending_orders'=>$pending,'paintings'=>$paintings,'customers'=>$customers,'revenue'=>$revenue]);
} catch(Throwable $e) { error_log('Dashboard stats error: '.$e->getMessage()); adminJsonResponse(['success'=>false,'message'=>'Unable to load dashboard statistics'],500); }
