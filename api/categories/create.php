<?php

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if (
    empty($_SESSION['admin_user_id']) ||
    ($_SESSION['admin_user_type'] ?? '') !== 'admin'
) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Administrator authentication required'
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

$data = json_decode(
    file_get_contents('php://input'),
    true
);

$name = trim($data['name'] ?? '');
$description = trim($data['description'] ?? '');

if ($name === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Category name is required'
    ]);

    exit;
}

$slug = strtolower($name);

$slug = preg_replace(
    '/[^a-z0-9]+/',
    '-',
    $slug
);

$slug = trim($slug, '-');

if ($slug === '') {
    $slug = 'category';
}

$baseSlug = $slug;
$counter = 1;

try {

    while (true) {

        $check = $pdo->prepare(
            'SELECT id
             FROM categories
             WHERE slug = ?
             LIMIT 1'
        );

        $check->execute([$slug]);

        if (!$check->fetch()) {
            break;
        }

        $counter++;
        $slug = $baseSlug . '-' . $counter;
    }


    $stmt = $pdo->prepare(
        'INSERT INTO categories
        (
            name,
            slug,
            description,
            is_active
        )
        VALUES
        (
            ?,
            ?,
            ?,
            1
        )'
    );

    $stmt->execute([
        $name,
        $slug,
        $description !== '' ? $description : null
    ]);

    $categoryId = (int) $pdo->lastInsertId();


    /*
     * Audit
     */

    $adminStmt = $pdo->prepare(
        'SELECT email
         FROM admin_users
         WHERE id = ?'
    );

    $adminStmt->execute([
        $_SESSION['admin_user_id']
    ]);

    $admin = $adminStmt->fetch();


    $audit = $pdo->prepare(
    'INSERT INTO audit_logs
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
    (?, ?, ?, ?, ?, ?, ?, ?)'
);

    $audit->execute([
    $_SESSION['admin_user_id'],
    $admin['email'] ?? null,
    'CREATE',
    'catalogue',
    'category',
    $categoryId,
    $_SERVER['REMOTE_ADDR'] ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null
]);


    echo json_encode([
        'success' => true,
        'message' => 'Category created successfully',
        'category_id' => $categoryId
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to create category'
    ]);
}