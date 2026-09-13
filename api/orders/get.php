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

$orderId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($orderId <= 0) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid order ID'
    ]);

    exit;
}

try {

    /* -------------------------------------------------------
       Load order
    ------------------------------------------------------- */

    $orderStmt = $pdo->prepare("
        SELECT
            id,
            order_number,
            user_id,
            status,
            subtotal,
            shipping_amount,
            discount_amount,
            total_amount,
            customer_notes,
            artist_notes,
            shipping_name,
            shipping_phone,
            shipping_address_line_1,
            shipping_address_line_2,
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
        WHERE id = ?
        LIMIT 1
    ");

    $orderStmt->execute([$orderId]);

    $order = $orderStmt->fetch();

    if (!$order) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);

        exit;
    }

    /* -------------------------------------------------------
       Load order items
    ------------------------------------------------------- */

    $itemsStmt = $pdo->prepare("
        SELECT
            id,
            order_id,
            painting_id,
            painting_name,
            artist_name,
            quantity,
            unit_price,
            total_price,
            created_at
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
    ");

    $itemsStmt->execute([$orderId]);

    $items = $itemsStmt->fetchAll();

    $order['items'] = $items;

    echo json_encode([
        'success' => true,
        'order' => $order
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load order'
    ]);
}