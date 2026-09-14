<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../config/database.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'], true)) {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$type = strtolower(trim((string)($data['type'] ?? '')));
$id = (int)($data['id'] ?? 0);
$adminId = (int)$_SESSION['admin_user_id'];

if ($id <= 0) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid metadata item'], 400);
}

if (!in_array($type, ['category', 'frame', 'size'], true)) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid metadata type'], 400);
}

try {
    $pdo->beginTransaction();

    if ($type === 'category') {
        $name = trim((string)($data['name'] ?? ''));
        $description = trim((string)($data['description'] ?? ''));

        if ($name === '') {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Category name is required'], 400);
        }

        $currentStmt = $pdo->prepare('SELECT id FROM categories WHERE id = ? LIMIT 1');
        $currentStmt->execute([$id]);
        if (!$currentStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Category not found'], 404);
        }

        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim((string)$slug, '-');
        if ($slug === '') {
            $slug = 'category';
        }

        $baseSlug = $slug;
        $counter = 1;
        $slugCheck = $pdo->prepare('SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1');
        while (true) {
            $slugCheck->execute([$slug, $id]);
            if (!$slugCheck->fetch(PDO::FETCH_ASSOC)) {
                break;
            }
            $counter++;
            $slug = $baseSlug . '-' . $counter;
        }

        $stmt = $pdo->prepare('UPDATE categories SET name = ?, slug = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$name, $slug, $description !== '' ? $description : null, $id]);
        $recordType = 'category';
        $message = 'Category updated successfully.';
    } elseif ($type === 'frame') {
        $name = trim((string)($data['name'] ?? ''));
        $description = trim((string)($data['description'] ?? ''));

        if ($name === '') {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Frame name is required'], 400);
        }

        $currentStmt = $pdo->prepare('SELECT id FROM frames WHERE id = ? LIMIT 1');
        $currentStmt->execute([$id]);
        if (!$currentStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Frame not found'], 404);
        }

        $duplicateStmt = $pdo->prepare('SELECT id FROM frames WHERE name = ? AND id <> ? LIMIT 1');
        $duplicateStmt->execute([$name, $id]);
        if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'A frame with this name already exists'], 409);
        }

        $stmt = $pdo->prepare('UPDATE frames SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$name, $description !== '' ? $description : null, $id]);
        $recordType = 'frame';
        $message = 'Frame updated successfully.';
    } else {
        $name = trim((string)($data['name'] ?? ''));
        $width = $data['width'] ?? null;
        $height = $data['height'] ?? null;
        $unit = trim((string)($data['unit'] ?? 'in'));

        if ($name === '') {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Display name is required'], 400);
        }
        if (!is_numeric($width) || !is_numeric($height) || (float)$width <= 0 || (float)$height <= 0) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Width and height must be valid positive numbers'], 400);
        }
        if (!in_array($unit, ['in', 'cm'], true)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Invalid unit'], 400);
        }

        $currentStmt = $pdo->prepare('SELECT id FROM default_sizes WHERE id = ? LIMIT 1');
        $currentStmt->execute([$id]);
        if (!$currentStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Default size not found'], 404);
        }

        $duplicateStmt = $pdo->prepare('SELECT id FROM default_sizes WHERE width = ? AND height = ? AND unit = ? AND id <> ? LIMIT 1');
        $duplicateStmt->execute([(float)$width, (float)$height, $unit, $id]);
        if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'A default size with these dimensions already exists'], 409);
        }

        $stmt = $pdo->prepare('UPDATE default_sizes SET name = ?, width = ?, height = ?, unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$name, (float)$width, (float)$height, $unit, $id]);
        $recordType = 'default_size';
        $message = 'Default size updated successfully.';
    }

    $adminStmt = $pdo->prepare('SELECT email FROM admin_users WHERE id = ? LIMIT 1');
    $adminStmt->execute([$adminId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (admin_user_id, admin_email, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $auditStmt->execute([
        $adminId,
        $admin['email'] ?? null,
        'UPDATE',
        'catalogue',
        $recordType,
        $id,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null,
    ]);

    $pdo->commit();
    adminJsonResponse(['success' => true, 'message' => $message, 'id' => $id, 'type' => $type]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Metadata update error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to update metadata'], 500);
}
