<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query('SELECT id, name, description, image, is_active, created_at, updated_at FROM frames ORDER BY name ASC');
    adminJsonResponse(['success' => true, 'frames' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Frames list error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load frames'], 500);
}
