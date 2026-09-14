<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

requireAdmin();
$orderId = (int)($_GET['order_id'] ?? 0);
if ($orderId <= 0) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid order ID'], 400);
}

try {
    $stmt = $pdo->prepare('SELECT id, order_id, old_status, new_status, changed_by, changed_by_type, notes, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC, id ASC');
    $stmt->execute([$orderId]);
    adminJsonResponse(['success' => true, 'history' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Admin order history error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load order history'], 500);
}
