<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$isCustomer=isset($_SESSION['user_id']) && ($_SESSION['user_type']??'')==='customer';

if (!$isCustomer) {
    jsonResponse(['success'=>false,'message'=>'User authentication required'],401);
}

unset(
    $_SESSION['user_id'],
    $_SESSION['user_type'],
    $_SESSION['user_email'],
    $_SESSION['user_authenticated_at']
);

jsonResponse(['success'=>true,'message'=>'Logged out successfully']);
