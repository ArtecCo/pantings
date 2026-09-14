<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();
$data = requestJson();
$cartItemId = (int)($data['cart_item_id'] ?? 0);

if ($cartItemId <= 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid cart item'], 422);
}

try {
    $stmt = $pdo->prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
    $stmt->execute([$cartItemId, $userId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'message' => 'Cart item not found'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'Item removed from cart']);
} catch (Throwable $e) {
    error_log('Cart remove error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to remove item from your cart'], 500);
}
