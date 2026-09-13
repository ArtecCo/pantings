<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

$userId=(int)($_SESSION['user_id']??0);

if ($userId<=0 || ($_SESSION['user_type']??'customer')!=='customer') {
    jsonResponse([
        'success'=>false,
        'authenticated'=>false,
        'message'=>'User authentication required'
    ],401);
}

try {
    $stmt=$pdo->prepare(
        'SELECT id,email,phone,first_name,last_name,is_active
         FROM users
         WHERE id=?
         LIMIT 1'
    );
    $stmt->execute([$userId]);
    $user=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['is_active']) {
        $_SESSION=[];
        session_destroy();
        jsonResponse([
            'success'=>false,
            'authenticated'=>false,
            'message'=>'User account is unavailable'
        ],401);
    }

    jsonResponse([
        'success'=>true,
        'authenticated'=>true,
        'user'=>[
            'id'=>(int)$user['id'],
            'email'=>$user['email'],
            'phone'=>$user['phone'],
            'first_name'=>$user['first_name'],
            'last_name'=>$user['last_name']
        ]
    ]);
} catch (Throwable $e) {
    error_log('User session check: '.$e->getMessage());
    jsonResponse(['success'=>false,'authenticated'=>false,'message'=>'Unable to check user session'],500);
}
