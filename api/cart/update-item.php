<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();
$data = requestJson();
$cartItemId = (int)($data['cart_item_id'] ?? 0);
$quantity = filter_var($data['quantity'] ?? null, FILTER_VALIDATE_INT);

if ($cartItemId <= 0 || $quantity === false || $quantity < 1) {
    jsonResponse(['success' => false, 'message' => 'Quantity must be at least 1'], 422);
}

try {
    $stmt = $pdo->prepare('
        SELECT ci.id, p.is_active
        FROM cart_items ci
        INNER JOIN paintings p ON p.id = ci.painting_id
        WHERE ci.id = ? AND ci.user_id = ?
        LIMIT 1
    ');
    $stmt->execute([$cartItemId, $userId]);
    $item = $stmt->fetch();

    if (!$item) {
        jsonResponse(['success' => false, 'message' => 'Cart item not found'], 404);
    }
    if (!(int)$item['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Painting is unavailable'], 409);
    }

    $stmt = $pdo->prepare('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
    $stmt->execute([$quantity, $cartItemId, $userId]);

    jsonResponse(['success' => true, 'message' => 'Cart updated']);
} catch (Throwable $e) {
    error_log('Cart update error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to update your cart'], 500);
}
