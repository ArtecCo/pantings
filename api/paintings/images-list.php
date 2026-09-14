<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $paintingId = (int)($_GET['painting_id'] ?? 0);
    if ($paintingId <= 0) {
        adminJsonResponse(['success' => false, 'message' => 'Invalid painting ID'], 400);
    }

    $stmt = $pdo->prepare('SELECT id,painting_id,image_url,sort_order,is_primary,created_at FROM painting_images WHERE painting_id=? ORDER BY sort_order ASC,id ASC');
    $stmt->execute([$paintingId]);

    adminJsonResponse(['success' => true, 'images' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
    error_log('Painting image list error: '.$e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load painting images'], 500);
}
