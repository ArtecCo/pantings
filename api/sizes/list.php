<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query('SELECT id, name, width, height, unit, is_active, created_at, updated_at FROM default_sizes ORDER BY width ASC, height ASC');
    adminJsonResponse(['success' => true, 'sizes' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Sizes list error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load default sizes'], 500);
}
