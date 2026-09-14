<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
$adminId = requireAdmin();
$data = adminRequestJson();
$orderId = (int)($data['order_id'] ?? 0);
$action = strtoupper(trim((string)($data['action'] ?? '')));
$notes = trim((string)($data['notes'] ?? ''));
if ($orderId <= 0) adminJsonResponse(['success' => false, 'message' => 'Invalid order'], 400);
if (strlen($notes) > 2000) adminJsonResponse(['success' => false, 'message' => 'Notes are too long'], 422);

$validStatuses = ['PENDING_ACCEPTANCE','ACCEPTED','PAYMENT_DUE','PAID','PROCESSING','DISPATCHED','DELIVERED','REJECTED'];
if (!in_array($action, $validStatuses, true)) adminJsonResponse(['success' => false, 'message' => 'Invalid order status'], 400);

try {
    $pdo->beginTransaction();
    $orderStmt = $pdo->prepare('SELECT id, order_number, status FROM orders WHERE id = ? FOR UPDATE');
    $orderStmt->execute([$orderId]);
    $order = $orderStmt->fetch();
    if (!$order) { $pdo->rollBack(); adminJsonResponse(['success' => false, 'message' => 'Order not found'], 404); }
    $oldStatus = strtoupper((string)$order['status']);
    if ($oldStatus === 'CANCELLED') {
        $pdo->rollBack();
        adminJsonResponse(['success' => false, 'message' => 'Customer-cancelled orders cannot be edited'], 409);
    }
    if ($oldStatus === $action && $notes === '') { $pdo->rollBack(); adminJsonResponse(['success' => false, 'message' => 'Order is already in this status'], 409); }

    $query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    $params = [$action];
    if ($notes !== '') { $query .= ', artist_notes = ?'; $params[] = $notes; }
    if ($action === 'ACCEPTED' && $oldStatus !== 'ACCEPTED') $query .= ', accepted_at = CURRENT_TIMESTAMP';
    if ($action === 'PAID' && $oldStatus !== 'PAID') $query .= ', paid_at = CURRENT_TIMESTAMP';
    if ($action === 'DISPATCHED' && $oldStatus !== 'DISPATCHED') $query .= ', dispatched_at = CURRENT_TIMESTAMP';
    if ($action === 'DELIVERED' && $oldStatus !== 'DELIVERED') $query .= ', delivered_at = CURRENT_TIMESTAMP';
    $query .= ' WHERE id = ?';
    $params[] = $orderId;
    $pdo->prepare($query)->execute($params);

    $historyStmt = $pdo->prepare("INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_by_type, notes) VALUES (?, ?, ?, ?, 'ADMIN', ?)");
    $historyStmt->execute([$orderId, $oldStatus, $action, $adminId, $notes !== '' ? $notes : null]);
    $pdo->commit();
    adminJsonResponse(['success' => true, 'message' => 'Order status updated successfully', 'order_id' => $orderId, 'order_number' => $order['order_number'], 'old_status' => $oldStatus, 'new_status' => $action]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Order status update error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to update order status'], 500);
}
