<?php

require_once __DIR__ . '/../config/database.php';

$password = 'Admin@12345';

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'UPDATE admin_users
     SET password_hash = ?
     WHERE email = ?'
);

$stmt->execute([
    $hash,
    'systems@domain.com'
]);

echo 'Temporary admin password configured.';