<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$adminId = requireAdmin();
$data = adminRequestJson();
$orderId = (int)($data['order_id'] ?? 0);
$action = trim((string)($data['action'] ?? ''));
$notes = trim((string)($data['notes'] ?? ''));

if ($orderId <= 0) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid order'], 400);
}
if (strlen($notes) > 2000) {
    adminJsonResponse(['success' => false, 'message' => 'Notes are too long'], 422);
}

$validStatuses = ['Order created', 'Artist to get in touch', 'Accepted', 'Processing', 'Dispatched', 'Delivered', 'REJECTED'];
if (!in_array($action, $validStatuses, true)) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid order action/status'], 400);
}

try {
    $pdo->beginTransaction();

    $orderStmt = $pdo->prepare('SELECT id, order_number, status FROM orders WHERE id = ? FOR UPDATE');
    $orderStmt->execute([$orderId]);
    $order = $orderStmt->fetch();
    if (!$order) {
        $pdo->rollBack();
        adminJsonResponse(['success' => false, 'message' => 'Order not found'], 404);
    }

    $oldStatus = (string)$order['status'];
    $newStatus = $action;

    if ($oldStatus === $newStatus && $notes === '') {
        $pdo->rollBack();
        adminJsonResponse(['success' => false, 'message' => 'Order is already in this status'], 409);
    }

    $updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    $params = [$newStatus];
    if ($notes !== '') {
        $updateQuery .= ', artist_notes = ?';
        $params[] = $notes;
    }
    if ($newStatus === 'Accepted' && $oldStatus !== 'Accepted') $updateQuery .= ', accepted_at = CURRENT_TIMESTAMP';
    if ($newStatus === 'Dispatched' && $oldStatus !== 'Dispatched') $updateQuery .= ', dispatched_at = CURRENT_TIMESTAMP';
    if ($newStatus === 'Delivered' && $oldStatus !== 'Delivered') $updateQuery .= ', delivered_at = CURRENT_TIMESTAMP';
    $updateQuery .= ' WHERE id = ?';
    $params[] = $orderId;

    $stmt = $pdo->prepare($updateQuery);
    $stmt->execute($params);

    $historyStmt = $pdo->prepare('INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_by_type, notes) VALUES (?, ?, ?, ?, \'ADMIN\', ?)');
    $historyStmt->execute([$orderId, $oldStatus, $newStatus, $adminId, $notes !== '' ? $notes : null]);

    $pdo->commit();

    adminJsonResponse([
        'success' => true,
        'message' => 'Order status updated successfully',
        'order_id' => $orderId,
        'order_number' => $order['order_number'],
        'old_status' => $oldStatus,
        'new_status' => $newStatus
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Order status update error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to update order status'], 500);
}
