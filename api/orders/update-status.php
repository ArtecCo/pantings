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

    if (!in_array($action, ['ACCEPT', 'REJECT'], true)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid order action'
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

        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);

        exit;
    }

    /*
     * Acceptance/rejection is only allowed while
     * the order is awaiting artist acceptance.
     */
    if ($order['status'] !== 'PENDING_ACCEPTANCE') {

        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'This order is no longer awaiting acceptance'
        ]);

        exit;
    }

    $oldStatus = $order['status'];

    $newStatus = $action === 'ACCEPT'
        ? 'ACCEPTED'
        : 'REJECTED';

    /*
     * Update order status and artist notes.
     */
    if ($notes !== '') {

        $updateStmt = $pdo->prepare("
            UPDATE orders
            SET
                status = ?,
                artist_notes = ?,
                accepted_at = CASE
                    WHEN ? = 'ACCEPTED'
                    THEN CURRENT_TIMESTAMP
                    ELSE accepted_at
                END
            WHERE id = ?
        ");

        $updateStmt->execute([
            $newStatus,
            $notes,
            $newStatus,
            $orderId
        ]);

    } else {

        $updateStmt = $pdo->prepare("
            UPDATE orders
            SET
                status = ?,
                accepted_at = CASE
                    WHEN ? = 'ACCEPTED'
                    THEN CURRENT_TIMESTAMP
                    ELSE accepted_at
                END
            WHERE id = ?
        ");

        $updateStmt->execute([
            $newStatus,
            $newStatus,
            $orderId
        ]);
    }

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
        'message' => $newStatus === 'ACCEPTED'
            ? 'Order accepted successfully'
            : 'Order rejected successfully',
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