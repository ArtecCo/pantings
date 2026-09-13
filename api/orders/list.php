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
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_amount,
            discount_amount,
            total_amount,
            shipping_name,
            shipping_phone,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            tracking_courier,
            tracking_id,
            tracking_url,
            accepted_at,
            paid_at,
            dispatched_at,
            delivered_at,
            created_at,
            updated_at
        FROM orders
        ORDER BY created_at DESC
    ";

    $stmt = $pdo->query($sql);

    $orders = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'orders' => $orders
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load orders'
    ]);
}