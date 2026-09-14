<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();
$data = requestJson();
$paintingId = (int)($data['painting_id'] ?? 0);
$quantity = filter_var($data['quantity'] ?? 1, FILTER_VALIDATE_INT);

if ($paintingId <= 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid painting'], 422);
}
if ($quantity === false || $quantity < 1) {
    jsonResponse(['success' => false, 'message' => 'Quantity must be at least 1'], 422);
}

try {
    $stmt = $pdo->prepare('SELECT id, stock, is_active FROM paintings WHERE id = ? LIMIT 1');
    $stmt->execute([$paintingId]);
    $painting = $stmt->fetch();

    if (!$painting || !(int)$painting['is_active']) {
        jsonResponse(['success' => false, 'message' => 'Painting is unavailable'], 404);
    }
    if ($quantity > (int)$painting['stock']) {
        jsonResponse(['success' => false, 'message' => 'Requested quantity is not available'], 409);
    }

    $stmt = $pdo->prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND painting_id = ? LIMIT 1');
    $stmt->execute([$userId, $paintingId]);
    $existing = $stmt->fetch();

    if ($existing) {
        $newQuantity = (int)$existing['quantity'] + $quantity;
        if ($newQuantity > (int)$painting['stock']) {
            jsonResponse(['success' => false, 'message' => 'Requested quantity is not available'], 409);
        }
        $stmt = $pdo->prepare('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
        $stmt->execute([$newQuantity, (int)$existing['id'], $userId]);
        $cartItemId = (int)$existing['id'];
    } else {
        $stmt = $pdo->prepare('INSERT INTO cart_items (user_id, painting_id, quantity) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $paintingId, $quantity]);
        $cartItemId = (int)$pdo->lastInsertId();
    }

    jsonResponse(['success' => true, 'cart_item_id' => $cartItemId, 'message' => 'Painting added to cart']);
} catch (PDOException $e) {
    if ((string)$e->getCode() === '23000') {
        jsonResponse(['success' => false, 'message' => 'This painting is already in your cart. Please try again.'], 409);
    }
    error_log('Cart add error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to add painting to cart'], 500);
} catch (Throwable $e) {
    error_log('Cart add error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to add painting to cart'], 500);
}
