<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = adminRequestJson();
$type = strtolower(trim((string)($data['type'] ?? '')));
$id = (int)($data['id'] ?? 0);
$adminId = (int)$_SESSION['admin_user_id'];

if ($id <= 0 || !in_array($type, ['category', 'frame', 'size'], true)) {
    adminJsonResponse(['success' => false, 'message' => 'Invalid metadata item'], 400);
}

try {
    $pdo->beginTransaction();

    if ($type === 'category') {
        $stmt = $pdo->prepare('SELECT id, name FROM categories WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$record) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Category not found'], 404);
        }

        $usage = $pdo->prepare('SELECT COUNT(*) FROM paintings WHERE category_id = ?');
        $usage->execute([$id]);
        if ((int)$usage->fetchColumn() > 0) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'This category is used by existing paintings. Deactivate it instead of deleting it.'], 409);
        }

        $delete = $pdo->prepare('DELETE FROM categories WHERE id = ?');
        $delete->execute([$id]);
        $recordType = 'category';
        $message = 'Category deleted successfully.';
    } elseif ($type === 'frame') {
        $stmt = $pdo->prepare('SELECT id, name FROM frames WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$record) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Frame not found'], 404);
        }

        $usage = $pdo->prepare("SELECT COUNT(*) FROM paintings WHERE frame = ?");
        $usage->execute([(string)$record['name']]);
        if ((int)$usage->fetchColumn() > 0) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'This frame is used by existing paintings. Deactivate it instead of deleting it.'], 409);
        }

        $delete = $pdo->prepare('DELETE FROM frames WHERE id = ?');
        $delete->execute([$id]);
        $recordType = 'frame';
        $message = 'Frame deleted successfully.';
    } else {
        $stmt = $pdo->prepare('SELECT id, name, width, height, unit FROM default_sizes WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$record) {
            $pdo->rollBack();
            adminJsonResponse(['success' => false, 'message' => 'Default size not found'], 404);
        }

        // Default sizes are templates; paintings retain their own size-option records.
        $delete = $pdo->prepare('DELETE FROM default_sizes WHERE id = ?');
        $delete->execute([$id]);
        $recordType = 'default_size';
        $message = 'Default size deleted successfully.';
    }

    $adminStmt = $pdo->prepare('SELECT email FROM admin_users WHERE id = ? LIMIT 1');
    $adminStmt->execute([$adminId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    $auditStmt = $pdo->prepare('INSERT INTO audit_logs (admin_user_id, admin_email, action, module, record_type, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $auditStmt->execute([
        $adminId,
        $admin['email'] ?? null,
        'DELETE',
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
    error_log('Metadata delete error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to delete metadata'], 500);
}
