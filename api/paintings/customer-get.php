<?php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {

    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid painting ID'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        "SELECT
            p.id,
            p.artist_id,
            p.category_id,
            p.name,
            p.slug,
            p.description,
            p.price,
            p.discount_price,
            p.width,
            p.height,
            p.medium,
            p.frame,
            p.gold_details,
            p.stock,
            p.is_featured,
            p.is_active,
            p.created_at,
            p.updated_at,
            c.name AS category_name
         FROM paintings p
         LEFT JOIN categories c
            ON c.id = p.category_id
         WHERE p.id = ?
           AND p.is_active = 1
         LIMIT 1"
    );

    $stmt->execute([$id]);

    $painting = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$painting) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Painting not found or unavailable'
        ]);

        exit;
    }

    /*
     * Load all images for the painting.
     */
    $imageStmt = $pdo->prepare(
        "SELECT
            id,
            image_url,
            is_primary,
            sort_order
         FROM painting_images
         WHERE painting_id = ?
         ORDER BY sort_order ASC, id ASC"
    );

    $imageStmt->execute([$id]);

    $painting['images'] = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'painting' => $painting
    ]);

} catch (Throwable $e) {

    error_log('Customer painting get error: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load painting'
    ]);
}