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

$orderId = isset($_GET['order_id'])
    ? (int) $_GET['order_id']
    : 0;

if ($orderId <= 0) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid order ID'
    ]);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            order_id,
            old_status,
            new_status,
            changed_by,
            changed_by_type,
            notes,
            created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at ASC, id ASC
    ");

    $stmt->execute([$orderId]);

    $history = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'history' => $history
    ]);

} catch (Throwable $e) {

    error_log(
        'Order history error: ' . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load order history'
    ]);
}