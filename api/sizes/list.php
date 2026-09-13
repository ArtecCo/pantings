<?php

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if (
    empty($_SESSION['admin_user_id']) ||
    ($_SESSION['admin_user_type'] ?? '') !== 'admin'
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Administrator authentication required'
    ]);

    exit;
}

try {

    $stmt = $pdo->query(
        'SELECT
            id,
            name,
            width,
            height,
            unit,
            is_active,
            created_at,
            updated_at
         FROM default_sizes
         ORDER BY width ASC, height ASC'
    );

    echo json_encode([
        'success' => true,
        'sizes' => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load default sizes'
    ]);
}