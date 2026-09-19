<?php
declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../email-validation/email-validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$adminId = requireAdmin();
$data = adminRequestJson();
$name = trim((string)($data['name'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$expiresHours = isset($data['expires_hours']) ? (int)$data['expires_hours'] : 48;

if ($name === '') adminJsonResponse(['success' => false, 'message' => 'Administrator name is required'], 422);
if (mb_strlen($name) > 160) adminJsonResponse(['success' => false, 'message' => 'Administrator name is too long'], 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) adminJsonResponse(['success' => false, 'message' => 'Valid email address is required'], 422);
if (!isAllowedEmailDomain($email)) adminJsonResponse(['success' => false, 'message' => 'Please use a non-disposable email address'], 422);
if ($expiresHours < 1 || $expiresHours > 168) adminJsonResponse(['success' => false, 'message' => 'Invitation expiry must be between 1 and 168 hours'], 422);

try {
    $stmt = $pdo->prepare('SELECT id FROM admin_users WHERE LOWER(email) = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) adminJsonResponse(['success' => false, 'message' => 'This email already belongs to an administrator'], 409);

    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + ($expiresHours * 3600));

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE admin_invitations SET used_at = NOW() WHERE LOWER(email) = ? AND used_at IS NULL');
        $stmt->execute([$email]);

        $stmt = $pdo->prepare(
            'INSERT INTO admin_invitations (email, token_hash, invited_by_admin_id, role_id, expires_at)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$email, $tokenHash, $adminId, null, $expiresAt]);
        $invitationId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare(
            'INSERT INTO audit_logs
             (admin_user_id, admin_email, action, module, record_type, record_id, description, new_value, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $adminId,
            $_SESSION['admin_email'] ?? null,
            'CREATE',
            'ADMIN_INVITATIONS',
            'ADMIN_INVITATION',
            $invitationId,
            'Created administrator invitation',
            json_encode(['name' => $name, 'email' => $email, 'expires_at' => $expiresAt], JSON_UNESCAPED_SLASHES),
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    $baseUrl = trim((string)(getenv('ADMIN_REGISTER_URL') ?: 'https://artsadmin.araha.co.in/register'));
    $invitationUrl = rtrim($baseUrl, '/') . '?token=' . urlencode($token) . '&name=' . urlencode($name);

    adminJsonResponse([
        'success' => true,
        'message' => 'Invitation created successfully',
        'invitation' => ['name' => $name, 'email' => $email, 'expires_at' => $expiresAt, 'url' => $invitationUrl],
    ]);
} catch (Throwable $e) {
    error_log('Admin invitation creation error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to create administrator invitation'], 500);
}
