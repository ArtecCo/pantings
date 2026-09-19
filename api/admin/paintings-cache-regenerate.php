<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../cache/paintings-cache.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $payload = writePaintingsCache($pdo);
    $cachePath = paintingsCachePath();

    adminJsonResponse([
        'success' => true,
        'message' => 'Painting cache regenerated successfully.',
        'generated_at' => $payload['generated_at'] ?? gmdate('c'),
        'painting_count' => count($payload['paintings'] ?? []),
        'cache_size' => is_file($cachePath) ? filesize($cachePath) : 0,
    ]);
} catch (Throwable $e) {
    error_log('Painting cache regeneration error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to regenerate painting cache.'], 500);
}
