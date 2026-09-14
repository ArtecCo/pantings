<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $input = adminRequestJson();
    $paintingId = (int)($input['painting_id'] ?? 0);
    $imageId = (int)($input['image_id'] ?? 0);
    if ($paintingId <= 0 || $imageId <= 0) {
        adminJsonResponse(['success' => false, 'message' => 'Invalid image information'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM painting_images WHERE id=? AND painting_id=? LIMIT 1');
    $check->execute([$imageId, $paintingId]);
    if (!$check->fetch()) {
        adminJsonResponse(['success' => false, 'message' => 'Image not found'], 404);
    }

    $pdo->beginTransaction();
    $pdo->prepare('UPDATE painting_images SET is_primary=0 WHERE painting_id=?')->execute([$paintingId]);
    $pdo->prepare('UPDATE painting_images SET is_primary=1 WHERE id=? AND painting_id=?')->execute([$imageId, $paintingId]);
    $pdo->commit();

    adminJsonResponse(['success' => true, 'message' => 'Primary image updated']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Primary image update error: '.$e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to update primary image'], 500);
}
