<?php

require_once __DIR__ . '/user-session.php';

jsonResponse([
    'success'=>true,
    'user'=>[
        'id'=>(int)$user['id'],
        'email'=>$user['email'],
        'phone'=>$user['phone'],
        'first_name'=>$user['first_name'],
        'last_name'=>$user['last_name']
    ]
]);
