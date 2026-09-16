<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mail/index.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
$userId = requireCustomer();
$data = requestJson();
$orderId = (int)($data['order_id'] ?? 0);
if ($orderId <= 0) jsonResponse(['success' => false, 'message' => 'Invalid order'], 400);

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT orders.id, orders.order_number, orders.status, orders.shipping_name, u.email AS customer_email FROM orders LEFT JOIN users u ON u.id=orders.user_id WHERE orders.id = ? AND orders.user_id = ? FOR UPDATE');
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) { $pdo->rollBack(); jsonResponse(['success' => false, 'message' => 'Order not found'], 404); }
    $oldStatus = strtoupper((string)$order['status']);
    if (in_array($oldStatus, ['CANCELLED','PAID','PROCESSING','DISPATCHED','DELIVERED'], true)) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'This order can no longer be cancelled'], 409);
    }
    $pdo->prepare("UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$orderId]);
    $historyStmt = $pdo->prepare("INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_by_type, notes) VALUES (?, ?, 'CANCELLED', ?, 'USER', 'Order cancelled by customer')");
    $historyStmt->execute([$orderId, $oldStatus, $userId]);
    $pdo->commit();
    sendOrderStatusNotification($pdo, $order, 'CANCELLED', 'Order cancelled by customer');
    jsonResponse(['success' => true, 'message' => 'Order cancelled successfully', 'order_id' => $orderId, 'order_number' => $order['order_number'], 'old_status' => $oldStatus, 'new_status' => 'CANCELLED']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Customer order cancellation error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to cancel this order'], 500);
}
