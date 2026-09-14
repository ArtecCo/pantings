<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
$userId = requireCustomer();
try {
    $sql = "SELECT id, order_number, status, subtotal, base_amount, customization_amount, shipping_amount, delivery_amount, discount_amount, total_amount, payment_link, price_released_at, shipping_name, shipping_phone, shipping_city, shipping_state, shipping_postal_code, shipping_country, tracking_courier, tracking_id, tracking_url, accepted_at, paid_at, dispatched_at, delivered_at, created_at, updated_at FROM orders WHERE user_id = ? ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $itemStmt = $pdo->prepare("SELECT oi.id, oi.painting_id, oi.painting_name, oi.quantity, oi.unit_price, oi.total_price, (SELECT pi.image_url FROM painting_images pi WHERE pi.painting_id = oi.painting_id ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url FROM order_items oi WHERE oi.order_id = ? ORDER BY oi.id ASC");
    $historyStmt = $pdo->prepare("SELECT id, order_id, old_status, new_status, changed_by_type, notes, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC, id ASC");
    foreach ($orders as &$order) {
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $historyStmt->execute([$order['id']]);
        $order['history'] = $historyStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($order);
    jsonResponse(['success' => true, 'orders' => $orders]);
} catch (Throwable $e) {
    error_log('Error fetching user orders: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load your orders'], 500);
}
