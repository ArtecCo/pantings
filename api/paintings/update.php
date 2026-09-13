<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
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
        'message' => 'Administrator authentication required'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

try {
    $adminId = (int) $_SESSION['admin_user_id'];
    $adminEmail = $_SESSION['admin_email'] ?? null;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        throw new Exception('Invalid request data');
    }

    $id = isset($input['id']) ? (int) $input['id'] : 0;

    if ($id <= 0) {
        throw new Exception('Invalid painting ID');
    }

    $name = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $description = trim($input['description'] ?? '');
    $price = $input['price'] ?? '';
    $width = $input['width'] ?? '';
    $height = $input['height'] ?? '';
    $frame = trim($input['frame'] ?? '');
    $goldDetails = trim($input['goldDetails'] ?? '');
    $status = $input['status'] ?? 'available';

    if ($name === '') {
        throw new Exception('Painting name is required');
    }

    if ($category === '') {
        throw new Exception('Category is required');
    }

    if ($price === '' || !is_numeric($price) || (float)$price < 0) {
        throw new Exception('Valid price is required');
    }

    if ($width === '' || !is_numeric($width) || (float)$width <= 0) {
        throw new Exception('Valid width is required');
    }

    if ($height === '' || !is_numeric($height) || (float)$height <= 0) {
        throw new Exception('Valid height is required');
    }

    if (!in_array($status, ['available', 'unavailable'], true)) {
        throw new Exception('Invalid painting status');
    }

    /*
     * Resolve category by name.
     */
    $categoryStmt = $pdo->prepare(
        "SELECT id
         FROM categories
         WHERE name = ?
         LIMIT 1"
    );

    $categoryStmt->execute([$category]);

    $categoryRow = $categoryStmt->fetch();

    if (!$categoryRow) {
        throw new Exception('Selected category was not found');
    }

    $categoryId = (int) $categoryRow['id'];

    /*
     * Make sure painting exists.
     */
    $existingStmt = $pdo->prepare(
        "SELECT id, name
         FROM paintings
         WHERE id = ?
         LIMIT 1"
    );

    $existingStmt->execute([$id]);

    $existing = $existingStmt->fetch();

    if (!$existing) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Painting not found'
        ]);

        exit;
    }

    /*
     * Generate slug.
     */
    $baseSlug = strtolower(trim($name));

    $baseSlug = preg_replace('/[^a-z0-9]+/i', '-', $baseSlug);
    $baseSlug = trim($baseSlug, '-');

    if ($baseSlug === '') {
        $baseSlug = 'painting';
    }

    $slug = $baseSlug;

    $slugStmt = $pdo->prepare(
        "SELECT id
         FROM paintings
         WHERE slug = ?
           AND id <> ?
         LIMIT 1"
    );

    $counter = 2;

    while (true) {
        $slugStmt->execute([$slug, $id]);

        if (!$slugStmt->fetch()) {
            break;
        }

        $slug = $baseSlug . '-' . $counter;
        $counter++;
    }

    $isActive = $status === 'available' ? 1 : 0;

    $updateStmt = $pdo->prepare(
        "UPDATE paintings
         SET
            category_id = ?,
            name = ?,
            slug = ?,
            description = ?,
            price = ?,
            width = ?,
            height = ?,
            frame = ?,
            gold_details = ?,
            is_active = ?,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = ?"
    );

    $updateStmt->execute([
        $categoryId,
        $name,
        $slug,
        $description !== '' ? $description : null,
        (float) $price,
        (float) $width,
        (float) $height,
        $frame !== '' ? $frame : null,
        $goldDetails !== '' ? $goldDetails : null,
        $isActive,
        $id
    ]);

    /*
     * Audit log.
     */
    $auditStmt = $pdo->prepare(
        "INSERT INTO audit_logs
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $auditStmt->execute([
        $adminId,
        $adminEmail,
        'UPDATE',
        'catalogue',
        'painting',
        $id,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Painting updated successfully',
        'painting_id' => $id
    ]);

} catch (Throwable $e) {

    error_log('Painting update error: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}