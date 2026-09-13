<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['success' => false, 'message' => 'User authentication required'], 401);
}

$data = requestJson();
$userId = (int)$_SESSION['user_id'];
$orderNumber = 'ORD-' . strtoupper(bin2hex(random_bytes(4))) . '-' . time();

// Default status for new orders
$status = 'Order created'; 

// Example fields. In a real app, calculate subtotal and validate items.
$subtotal = isset($data['subtotal']) ? (float)$data['subtotal'] : 0.00;
$shippingAmount = isset($data['shipping_amount']) ? (float)$data['shipping_amount'] : 0.00;
$discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0.00;
$totalAmount = $subtotal + $shippingAmount - $discountAmount;

$shippingName = $data['shipping_name'] ?? '';
$shippingPhone = $data['shipping_phone'] ?? '';
$shippingCity = $data['shipping_city'] ?? '';
$shippingState = $data['shipping_state'] ?? '';
$shippingPostalCode = $data['shipping_postal_code'] ?? '';
$shippingCountry = $data['shipping_country'] ?? '';

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_number, user_id, status, subtotal, shipping_amount, discount_amount, total_amount,
            shipping_name, shipping_phone, shipping_city, shipping_state, shipping_postal_code, shipping_country,
            created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
    ");

    $stmt->execute([
        $orderNumber, $userId, $status, $subtotal, $shippingAmount, $discountAmount, $totalAmount,
        $shippingName, $shippingPhone, $shippingCity, $shippingState, $shippingPostalCode, $shippingCountry
    ]);
    
    $orderId = $pdo->lastInsertId();

    $historyStmt = $pdo->prepare("
        INSERT INTO order_status_history (
            order_id, old_status, new_status, changed_by, changed_by_type, notes
        ) VALUES (?, NULL, ?, ?, 'USER', 'Initial order creation')
    ");
    $historyStmt->execute([$orderId, $status, $userId]);

    $pdo->commit();

    jsonResponse([
        'success' => true, 
        'message' => 'Order created successfully',
        'order_number' => $orderNumber,
        'order_id' => $orderId
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Order creation error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to create order'], 500);
}
