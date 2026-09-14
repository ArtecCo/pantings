<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();
$data = requestJson();

$shippingName = trim((string)($data['shipping_name'] ?? ''));
$shippingPhone = trim((string)($data['shipping_phone'] ?? ''));
$shippingCity = trim((string)($data['shipping_city'] ?? ''));
$shippingState = trim((string)($data['shipping_state'] ?? ''));
$shippingPostalCode = trim((string)($data['shipping_postal_code'] ?? ''));
$shippingCountry = trim((string)($data['shipping_country'] ?? ''));

if ($shippingName === '' || $shippingPhone === '' || $shippingCity === '' || $shippingState === '' || $shippingPostalCode === '' || $shippingCountry === '') {
    jsonResponse(['success' => false, 'message' => 'Complete shipping details are required'], 422);
}
if (strlen($shippingName) > 150 || strlen($shippingPhone) > 40 || strlen($shippingCity) > 100 || strlen($shippingState) > 100 || strlen($shippingPostalCode) > 30 || strlen($shippingCountry) > 100) {
    jsonResponse(['success' => false, 'message' => 'One or more shipping details are too long'], 422);
}

// Shipping is intentionally calculated by the server. The client never supplies
// subtotal, discount, shipping, or total amounts.
$shippingAmount = 25.00;
$discountAmount = 0.00;
$status = 'Order created';

try {
    $pdo->beginTransaction();

    // Lock the cart rows and their paintings for the duration of checkout.
    $stmt = $pdo->prepare("
        SELECT
            ci.id AS cart_item_id,
            ci.painting_id,
            ci.quantity,
            p.name,
            p.artist_name,
            p.price,
            p.discount_price,
            p.stock,
            p.is_active
        FROM cart_items ci
        INNER JOIN paintings p ON p.id = ci.painting_id
        WHERE ci.user_id = ?
        ORDER BY ci.id ASC
        FOR UPDATE
    ");
    $stmt->execute([$userId]);
    $cartItems = $stmt->fetchAll();

    if (!$cartItems) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Your cart is empty'], 409);
    }

    $subtotal = 0.00;
    foreach ($cartItems as $item) {
        $quantity = (int)$item['quantity'];
        $stock = (int)$item['stock'];
        if (!(int)$item['is_active']) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'One or more paintings in your cart are no longer available'], 409);
        }
        if ($quantity < 1 || $quantity > $stock) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'One or more paintings no longer have the requested quantity available'], 409);
        }

        $unitPrice = $item['discount_price'] !== null && (float)$item['discount_price'] > 0
            ? (float)$item['discount_price']
            : (float)$item['price'];
        if ($unitPrice < 0) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => 'Invalid painting price'], 500);
        }
        $subtotal += $unitPrice * $quantity;
    }

    $subtotal = round($subtotal, 2);
    $totalAmount = round($subtotal + $shippingAmount - $discountAmount, 2);
    if ($totalAmount < 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Invalid order total'], 500);
    }

    $orderNumber = 'ORD-' . strtoupper(bin2hex(random_bytes(8)));

    $stmt = $pdo->prepare("
        INSERT INTO orders (
            order_number, user_id, status, subtotal, shipping_amount, discount_amount, total_amount,
            shipping_name, shipping_phone, shipping_city, shipping_state, shipping_postal_code, shipping_country,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([
        $orderNumber,
        $userId,
        $status,
        $subtotal,
        $shippingAmount,
        $discountAmount,
        $totalAmount,
        $shippingName,
        $shippingPhone,
        $shippingCity,
        $shippingState,
        $shippingPostalCode,
        $shippingCountry
    ]);

    $orderId = (int)$pdo->lastInsertId();

    $itemStmt = $pdo->prepare("
        INSERT INTO order_items (
            order_id, painting_id, painting_name, artist_name, quantity, unit_price, total_price, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stockStmt = $pdo->prepare('UPDATE paintings SET stock = stock - ? WHERE id = ? AND stock >= ?');

    foreach ($cartItems as $item) {
        $quantity = (int)$item['quantity'];
        $unitPrice = $item['discount_price'] !== null && (float)$item['discount_price'] > 0
            ? (float)$item['discount_price']
            : (float)$item['price'];
        $lineTotal = round($unitPrice * $quantity, 2);

        $itemStmt->execute([
            $orderId,
            (int)$item['painting_id'],
            (string)$item['name'],
            (string)($item['artist_name'] ?? ''),
            $quantity,
            $unitPrice,
            $lineTotal
        ]);

        $stockStmt->execute([$quantity, (int)$item['painting_id'], $quantity]);
        if ($stockStmt->rowCount() !== 1) {
            throw new RuntimeException('Stock changed during checkout');
        }
    }

    $historyStmt = $pdo->prepare("
        INSERT INTO order_status_history (
            order_id, old_status, new_status, changed_by, changed_by_type, notes
        ) VALUES (?, NULL, ?, ?, 'USER', 'Initial order creation')
    ");
    $historyStmt->execute([$orderId, $status, $userId]);

    $clearCartStmt = $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?');
    $clearCartStmt->execute([$userId]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Order created successfully',
        'order_number' => $orderNumber,
        'order_id' => $orderId,
        'subtotal' => $subtotal,
        'shipping_amount' => $shippingAmount,
        'discount_amount' => $discountAmount,
        'total_amount' => $totalAmount
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Order creation error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to create order'], 500);
}
