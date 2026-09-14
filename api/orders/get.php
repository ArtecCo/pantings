<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
requireAdmin();
$orderId = (int)($_GET['id'] ?? 0);
if ($orderId <= 0) adminJsonResponse(['success' => false, 'message' => 'Invalid order ID'], 400);
try {
    $orderStmt = $pdo->prepare('SELECT id, order_number, user_id, status, subtotal, base_amount, customization_amount, shipping_amount, delivery_amount, discount_amount, total_amount, payment_link, price_released_at, price_released_by, customer_notes, artist_notes, shipping_name, shipping_phone, shipping_address_line_1, shipping_address_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, tracking_courier, tracking_id, tracking_url, accepted_at, paid_at, dispatched_at, delivered_at, created_at, updated_at FROM orders WHERE id = ? LIMIT 1');
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
