<?php
declare(strict_types=1);

$host = trim((string)(getenv('DB_HOST') ?: '127.0.0.1'));
$db = trim((string)(getenv('DB_NAME') ?: 'painting_marketplace'));
$user = (string)(getenv('DB_USER') ?: 'root');
$pass = (string)(getenv('DB_PASSWORD') ?: '');
$charset = trim((string)(getenv('DB_CHARSET') ?: 'utf8mb4'));

$dsn = "mysql:host={$host};dbname={$db};charset={$charset}";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    http_response_code(500);
    die('Database connection failed.');
}
