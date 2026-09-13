<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
        'message' => 'Admin authentication required'
    ]);

    exit;
}

try {

    $sql = "
        SELECT
            p.id,
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

            c.name AS category_name

        FROM paintings p

        LEFT JOIN categories c
            ON c.id = p.category_id

        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->query($sql);

    $paintings = $stmt->fetchAll();

    /*
     * Load all images for each painting.
     */
    $imageStmt = $pdo->prepare("
        SELECT
            id,
            image_url,
            sort_order,
            is_primary
        FROM painting_images
        WHERE painting_id = ?
        ORDER BY sort_order ASC, id ASC
    ");

    foreach ($paintings as &$painting) {

        $imageStmt->execute([$painting['id']]);

        $painting['images'] = $imageStmt->fetchAll();

        /*
         * Keep image_url for compatibility with the existing UI.
         * It points to the first image.
         */
        $painting['image_url'] = !empty($painting['images'])
            ? $painting['images'][0]['image_url']
            : null;
    }

    unset($painting);

    echo json_encode([
        'success' => true,
        'paintings' => $paintings
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load paintings'
    ]);
}