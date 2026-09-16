<?php
declare(strict_types=1);

/**
 * Production deployments can provide api/config/production.php on the server.
 * That file is intentionally not committed to Git and should return:
 *
 * return [
 *     'db' => [
 *         'host' => 'localhost',
 *         'name' => 'painting_marketplace',
 *         'user' => 'your_database_user',
 *         'password' => 'your_database_password',
 *         'charset' => 'utf8mb4',
 *     ],
 * ];
 *
 * Local development can continue to use environment variables.
 */
$productionConfigFile = __DIR__ . '/production.php';
$productionConfig = [];

if (is_file($productionConfigFile)) {
    $loadedConfig = require $productionConfigFile;
    if (!is_array($loadedConfig)) {
        error_log('Production database config must return an array.');
        http_response_code(500);
        die('Invalid database configuration.');
    }
    $productionConfig = $loadedConfig;
}

$dbConfig = is_array($productionConfig['db'] ?? null) ? $productionConfig['db'] : [];

$host = trim((string)($dbConfig['host'] ?? getenv('DB_HOST') ?: '127.0.0.1'));
$db = trim((string)($dbConfig['name'] ?? getenv('DB_NAME') ?: 'painting_marketplace'));
$user = (string)($dbConfig['user'] ?? getenv('DB_USER') ?: 'root');
$pass = (string)($dbConfig['password'] ?? getenv('DB_PASSWORD') ?: '');
$charset = trim((string)($dbConfig['charset'] ?? getenv('DB_CHARSET') ?: 'utf8mb4'));

if ($host === '' || $db === '' || $user === '') {
    error_log('Database configuration is incomplete.');
    http_response_code(500);
    die('Database configuration is incomplete.');
}

// Apply the API rate limiter before opening a database connection. It excludes
// the public painting list and bypasses authenticated, verified administrators.
require_once __DIR__ . '/../security/rate-limit.php';

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
