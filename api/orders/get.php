<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
requireAdmin();
$orderId = (int)($_GET['id'] ?? 0);
if ($orderId <= 0) adminJsonResponse(['success' => false, 'message' => 'Invalid order ID'], 400);
try {
    $orderStmt = $pdo->prepare('SELECT o.id, o.order_number, o.user_id, o.status, o.subtotal, o.base_amount, o.customization_amount, o.shipping_amount, o.delivery_amount, o.discount_amount, o.total_amount, o.payment_link, o.price_released_at, o.price_released_by, o.customer_notes, o.artist_notes, o.shipping_name, o.shipping_phone, COALESCE(o.customer_email, u.email) AS customer_email, o.shipping_address_line_1, o.shipping_address_line_2, o.shipping_city, o.shipping_state, o.shipping_postal_code, o.shipping_country, o.tracking_courier, o.tracking_id, o.tracking_url, o.accepted_at, o.paid_at, o.dispatched_at, o.delivered_at, o.created_at, o.updated_at FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ? LIMIT 1');
    $orderStmt->execute([$orderId]);
    $order = $orderStmt->fetch();
    if (!$order) adminJsonResponse(['success' => false, 'message' => 'Order not found'], 404);

    // order_items does not store artist_name; the customer order API uses the
    // same schema and falls back to the site artist label in the UI.
    $itemsStmt = $pdo->prepare('SELECT id, order_id, painting_id, painting_name, quantity, unit_price, total_price, created_at FROM order_items WHERE order_id = ? ORDER BY id ASC');
    $itemsStmt->execute([$orderId]);
    $order['items'] = $itemsStmt->fetchAll();
    adminJsonResponse(['success' => true, 'order' => $order]);
} catch (Throwable $e) {
    error_log('Admin order detail error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load order'], 500);
}
