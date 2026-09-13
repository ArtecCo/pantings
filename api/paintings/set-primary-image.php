<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

if (!isset($_SESSION['admin_user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Administrator authentication required'
    ]);
    exit;
}

try {

    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    $paintingId = (int)($input['painting_id'] ?? 0);
    $imageId = (int)($input['image_id'] ?? 0);

    if ($paintingId <= 0 || $imageId <= 0) {
        throw new Exception('Invalid image information');
    }

    $check = $pdo->prepare("
        SELECT id
        FROM painting_images
        WHERE id = ?
        AND painting_id = ?
        LIMIT 1
    ");

    $check->execute([
        $imageId,
        $paintingId
    ]);

    if (!$check->fetch()) {
        throw new Exception('Image not found');
    }

    $pdo->beginTransaction();

    $reset = $pdo->prepare("
        UPDATE painting_images
        SET is_primary = 0
        WHERE painting_id = ?
    ");

    $reset->execute([$paintingId]);

    $primary = $pdo->prepare("
        UPDATE painting_images
        SET is_primary = 1
        WHERE id = ?
        AND painting_id = ?
    ");

    $primary->execute([
        $imageId,
        $paintingId
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Primary image updated'
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}