<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
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

    $imageId = (int)($input['image_id'] ?? 0);

    if ($imageId <= 0) {
        throw new Exception('Invalid image ID');
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            painting_id,
            image_url,
            is_primary
        FROM painting_images
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$imageId]);

    $image = $stmt->fetch();

    if (!$image) {
        throw new Exception('Image not found');
    }

    $paintingId = (int)$image['painting_id'];

    $delete = $pdo->prepare("
        DELETE FROM painting_images
        WHERE id = ?
    ");

    $delete->execute([$imageId]);

    $relativePath = $image['image_url'];

    $prefix = '/paintings/api/paintings/';

    if (strpos($relativePath, $prefix) === 0) {

        $filename = substr(
            $relativePath,
            strlen($prefix)
        );

        $filePath = __DIR__ . '/' . $filename;

        if (is_file($filePath)) {
            unlink($filePath);
        }
    }

    if ((int)$image['is_primary'] === 1) {

        $next = $pdo->prepare("
            SELECT id
            FROM painting_images
            WHERE painting_id = ?
            ORDER BY sort_order ASC, id ASC
            LIMIT 1
        ");

        $next->execute([$paintingId]);

        $nextImage = $next->fetch();

        if ($nextImage) {

            $makePrimary = $pdo->prepare("
                UPDATE painting_images
                SET is_primary = 1
                WHERE id = ?
            ");

            $makePrimary->execute([
                $nextImage['id']
            ]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Image removed successfully'
    ]);

} catch (Throwable $e) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}