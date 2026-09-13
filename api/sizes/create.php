<?php

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

require_once __DIR__ . '/../config/database.php';

if (!isset($_SESSION['admin_user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Admin authentication required'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$width = $input['width'] ?? null;
$height = $input['height'] ?? null;
$unit = trim($input['unit'] ?? 'in');

if ($name === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Display name is required'
    ]);
    exit;
}

if ($width === null || $height === null || $width === '' || $height === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Width and height are required'
    ]);
    exit;
}

if (!is_numeric($width) || !is_numeric($height) || $width <= 0 || $height <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Width and height must be valid positive numbers'
    ]);
    exit;
}

if (!in_array($unit, ['in', 'cm'], true)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid unit'
    ]);
    exit;
}

try {

    // Prevent duplicate dimensions
    $check = $pdo->prepare("
        SELECT id
        FROM default_sizes
        WHERE width = ?
          AND height = ?
          AND unit = ?
        LIMIT 1
    ");

    $check->execute([
        $width,
        $height,
        $unit
    ]);

    if ($check->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'A default size with these dimensions already exists'
        ]);
        exit;
    }

    // Create size
    $stmt = $pdo->prepare("
        INSERT INTO default_sizes
            (name, width, height, unit, is_active)
        VALUES
            (?, ?, ?, ?, 1)
    ");

    $stmt->execute([
        $name,
        $width,
        $height,
        $unit
    ]);

    $sizeId = $pdo->lastInsertId();

    // Audit log
    $audit = $pdo->prepare("
        INSERT INTO audit_logs
            (
                admin_user_id,
                admin_email,
                action,
                module,
                record_type,
                record_id,
                ip_address,
                user_agent
            )
        VALUES
            (?, ?, 'CREATE', 'catalogue', 'default_size', ?, ?, ?)
    ");

    $audit->execute([
        $_SESSION['admin_user_id'],
        $_SESSION['admin_email'] ?? '',
        $sizeId,
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Default size created successfully',
        'size_id' => $sizeId
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to create default size'
    ]);
}