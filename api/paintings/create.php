<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$name = trim((string)($data['name'] ?? ''));
$categoryName = trim((string)($data['category'] ?? ''));
$description = trim((string)($data['description'] ?? ''));
$price = $data['price'] ?? null;
$width = $data['width'] ?? null;
$height = $data['height'] ?? null;
$frame = trim((string)($data['frame'] ?? ''));
$status = (string)($data['status'] ?? 'available');

if ($name === '') adminJsonResponse(['success' => false, 'message' => 'Painting name is required'], 400);
if ($categoryName === '') adminJsonResponse(['success' => false, 'message' => 'Category is required'], 400);
if ($price === null || !is_numeric($price) || (float)$price < 0) adminJsonResponse(['success' => false, 'message' => 'Valid price is required'], 400);
if ($width !== null && $width !== '' && (!is_numeric($width) || (float)$width < 0)) adminJsonResponse(['success' => false, 'message' => 'Invalid width'], 400);
if ($height !== null && $height !== '' && (!is_numeric($height) || (float)$height < 0)) adminJsonResponse(['success' => false, 'message' => 'Invalid height'], 400);
if (!in_array($status, ['available', 'unavailable'], true)) adminJsonResponse(['success' => false, 'message' => 'Invalid status'], 400);

try {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim((string)$slug, '-');
    if ($slug === '') $slug = 'painting';
    $baseSlug = $slug;
    $counter = 1;
    $slugCheck = $pdo->prepare('SELECT id FROM paintings WHERE slug = ? LIMIT 1');
    while (true) {
        $slugCheck->execute([$slug]);
        if (!$slugCheck->fetch()) break;
        $counter++;
        $slug = $baseSlug . '-' . $counter;
    }

    $categoryStmt = $pdo->prepare('SELECT id FROM categories WHERE name = ? AND is_active = 1 LIMIT 1');
    $categoryStmt->execute([$categoryName]);
    $category = $categoryStmt->fetch(PDO::FETCH_ASSOC);
    if (!$category) adminJsonResponse(['success' => false, 'message' => 'Selected category does not exist'], 400);

    $adminId = (int)$_SESSION['admin_user_id'];
    $isActive = $status === 'available' ? 1 : 0;
    $stmt = $pdo->prepare('INSERT INTO paintings (artist_id,category_id,name,slug,description,price,discount_price,width,height,medium,frame,stock,is_featured,is_active) VALUES (NULL,?,?,?,?,?,NULL,?,?,NULL,?,1,0,?)');
    $stmt->execute([(int)$category['id'], $name, $slug, $description !== '' ? $description : null, (float)$price, $width !== '' ? $width : null, $height !== '' ? $height : null, $frame !== '' ? $frame : null, $isActive]);
    $paintingId = (int)$pdo->lastInsertId();

    $adminStmt = $pdo->prepare('SELECT email FROM admin_users WHERE id = ? LIMIT 1');
    $adminStmt->execute([$adminId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?)');
    $auditStmt->execute([$adminId, $admin['email'] ?? null, 'CREATE', 'catalogue', 'painting', $paintingId, $_SERVER['REMOTE_ADDR'] ?? null, $_SERVER['HTTP_USER_AGENT'] ?? null]);

    adminJsonResponse(['success' => true, 'message' => 'Painting created successfully', 'painting_id' => $paintingId]);
} catch (Throwable $e) {
    error_log('Painting create error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to create painting'], 500);
}
