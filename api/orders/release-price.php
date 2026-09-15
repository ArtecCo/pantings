<?php
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../mail/index.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
$adminId = requireAdmin();
$data = adminRequestJson();
$orderId = (int)($data['order_id'] ?? 0);
$baseAmount = isset($data['base_amount']) ? (float)$data['base_amount'] : 0;
$customizationAmount = isset($data['customization_amount']) ? (float)$data['customization_amount'] : 0;
$deliveryAmount = isset($data['delivery_amount']) ? (float)$data['delivery_amount'] : 0;
$discountAmount = isset($data['discount_amount']) ? (float)$data['discount_amount'] : 0;
$paymentLink = trim((string)($data['payment_link'] ?? ''));
$notes = trim((string)($data['notes'] ?? ''));
if ($orderId <= 0) adminJsonResponse(['success' => false, 'message' => 'Invalid order'], 400);
foreach (['base amount' => $baseAmount, 'customization amount' => $customizationAmount, 'delivery amount' => $deliveryAmount, 'discount amount' => $discountAmount] as $label => $value) { if ($value < 0) adminJsonResponse(['success' => false, 'message' => "Invalid {$label}"], 422); }
if ($paymentLink !== '' && !filter_var($paymentLink, FILTER_VALIDATE_URL)) adminJsonResponse(['success' => false, 'message' => 'Payment link must be a valid URL'], 422);
if (strlen($paymentLink) > 1000 || strlen($notes) > 2000) adminJsonResponse(['success' => false, 'message' => 'Payment link or notes are too long'], 422);
$finalAmount = round($baseAmount + $customizationAmount + $deliveryAmount - $discountAmount, 2);
if ($finalAmount < 0) adminJsonResponse(['success' => false, 'message' => 'Discount cannot exceed the quoted amount'], 422);

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT o.id, o.order_number, o.status, o.shipping_name, u.email AS customer_email FROM orders o LEFT JOIN users u ON u.id=o.user_id WHERE o.id = ? FOR UPDATE');
    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) { $pdo->rollBack(); adminJsonResponse(['success' => false, 'message' => 'Order not found'], 404); }
    $currentStatus = strtoupper((string)$order['status']);
    if ($currentStatus === 'CANCELLED') { $pdo->rollBack(); adminJsonResponse(['success' => false, 'message' => 'Customer-cancelled orders cannot be edited'], 409); }
    if ($currentStatus !== 'ACCEPTED' && $currentStatus !== 'PAYMENT_DUE') { $pdo->rollBack(); adminJsonResponse(['success' => false, 'message' => 'The order must be accepted before its price can be released'], 409); }
    $update = $pdo->prepare('UPDATE orders SET base_amount = ?, subtotal = ?, customization_amount = ?, delivery_amount = ?, shipping_amount = ?, discount_amount = ?, total_amount = ?, payment_link = ?, price_released_at = CURRENT_TIMESTAMP, price_released_by = ?, status = ?, artist_notes = CASE WHEN ? <> \'\' THEN ? ELSE artist_notes END, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $update->execute([$baseAmount, $baseAmount, $customizationAmount, $deliveryAmount, $deliveryAmount, $discountAmount, $finalAmount, $paymentLink !== '' ? $paymentLink : null, $adminId, 'PAYMENT_DUE', $notes, $notes, $orderId]);
    $history = $pdo->prepare("INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_by_type, notes) VALUES (?, ?, 'PAYMENT_DUE', ?, 'ADMIN', ?)");
    $history->execute([$orderId, $currentStatus, $adminId, $notes !== '' ? $notes : 'Final price released']);
    $pdo->commit();
    $order['customer_email'] = (string)($order['customer_email'] ?? '');
    sendOrderStatusNotification($pdo, $order, 'PAYMENT_DUE', $notes !== '' ? $notes : 'Your final price is now available.');
    adminJsonResponse(['success' => true, 'message' => 'Final price released successfully', 'order_id' => $orderId, 'order_number' => $order['order_number'], 'new_status' => 'PAYMENT_DUE', 'base_amount' => $baseAmount, 'customization_amount' => $customizationAmount, 'delivery_amount' => $deliveryAmount, 'discount_amount' => $discountAmount, 'total_amount' => $finalAmount, 'payment_link' => $paymentLink]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Order price release error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to release order price'], 500);
}
