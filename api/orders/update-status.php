<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    $orderId = isset($input['order_id'])
        ? (int) $input['order_id']
        : 0;

    $action = isset($input['action'])
        ? trim($input['action'])
        : '';

    $notes = isset($input['notes'])
        ? trim($input['notes'])
        : '';

    if ($orderId <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid order'
        ]);

        exit;
    }

    $validStatuses = [
        'Order created',
        'Artist to get in touch',
        'Accepted',
        'Processing',
        'Dispatched',
        'Delivered',
        'REJECTED' // keeping for backward compatibility if needed, or maybe just stick to requested ones
    ];

    if (!in_array($action, $validStatuses, true)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid order action/status'
        ]);

        exit;
    }

    /*
     * Load the order and lock it while changing its status.
     */
    $pdo->beginTransaction();

    $orderStmt = $pdo->prepare("
        SELECT
            id,
            order_number,
            status
        FROM orders
        WHERE id = ?
        FOR UPDATE
    ");

    $orderStmt->execute([$orderId]);

    $order = $orderStmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit;
    }

    $oldStatus = $order['status'];
    $newStatus = $action;

    /*
     * Update order status and artist notes.
     */
    $updateQuery = "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP";
    $params = [$newStatus];

    if ($notes !== '') {
        $updateQuery .= ", artist_notes = ?";
        $params[] = $notes;
    }

    if ($newStatus === 'Accepted' && $oldStatus !== 'Accepted') {
        $updateQuery .= ", accepted_at = CURRENT_TIMESTAMP";
    }
    if ($newStatus === 'Dispatched' && $oldStatus !== 'Dispatched') {
        $updateQuery .= ", dispatched_at = CURRENT_TIMESTAMP";
    }
    if ($newStatus === 'Delivered' && $oldStatus !== 'Delivered') {
        $updateQuery .= ", delivered_at = CURRENT_TIMESTAMP";
    }

    $updateQuery .= " WHERE id = ?";
    $params[] = $orderId;

    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->execute($params);

    /*
     * Record the status change.
     */
    $historyStmt = $pdo->prepare("
        INSERT INTO order_status_history (
            order_id,
            old_status,
            new_status,
            changed_by,
            changed_by_type,
            notes
        )
        VALUES (?, ?, ?, ?, 'ADMIN', ?)
    ");

    $historyStmt->execute([
        $orderId,
        $oldStatus,
        $newStatus,
        $_SESSION['admin_user_id'],
        $notes !== '' ? $notes : null
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Order status updated successfully',
        'order_id' => $orderId,
        'order_number' => $order['order_number'],
        'old_status' => $oldStatus,
        'new_status' => $newStatus
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Order status update error: ' . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to update order status'
    ]);
}