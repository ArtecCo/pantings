<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();

try {
    $sql = "
        SELECT
            id,
            order_number,
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
        WHERE user_id = ?
        ORDER BY created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(['success' => true, 'orders' => $orders]);
} catch (Throwable $e) {
    error_log('Error fetching user orders: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load your orders'], 500);
}
