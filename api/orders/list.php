<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

requireAdmin();

try {
    $stmt = $pdo->query("SELECT id, order_number, user_id, status, subtotal, shipping_amount, discount_amount, total_amount, shipping_name, shipping_phone, shipping_city, shipping_state, shipping_postal_code, shipping_country, tracking_courier, tracking_id, tracking_url, accepted_at, paid_at, dispatched_at, delivered_at, created_at, updated_at FROM orders ORDER BY created_at DESC");
    adminJsonResponse(['success' => true, 'orders' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Admin order list error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load orders'], 500);
}
