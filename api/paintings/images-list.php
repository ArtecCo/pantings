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
        'message' => 'Administrator authentication required'
    ]);
    exit;
}

try {

    $paintingId = (int)($_GET['painting_id'] ?? 0);

    if ($paintingId <= 0) {
        throw new Exception('Invalid painting ID');
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            painting_id,
            image_url,
            sort_order,
            is_primary,
            created_at
        FROM painting_images
        WHERE painting_id = ?
        ORDER BY sort_order ASC, id ASC
    ");

    $stmt->execute([$paintingId]);

    echo json_encode([
        'success' => true,
        'images' => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}