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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

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

$adminId = (int) $_SESSION['admin_user_id'];


/*
|--------------------------------------------------------------------------
| Read request
|--------------------------------------------------------------------------
*/

$data = json_decode(
    file_get_contents('php://input'),
    true
);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid request'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Fields
|--------------------------------------------------------------------------
*/

$name = trim($data['name'] ?? '');
$categoryName = trim($data['category'] ?? '');
$description = trim($data['description'] ?? '');

$price = $data['price'] ?? null;
$width = $data['width'] ?? null;
$height = $data['height'] ?? null;

$frame = trim($data['frame'] ?? '');

$status = $data['status'] ?? 'available';


/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($name === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Painting name is required'
    ]);

    exit;
}

if ($categoryName === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Category is required'
    ]);

    exit;
}

if (
    $price === null ||
    !is_numeric($price) ||
    $price < 0
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Valid price is required'
    ]);

    exit;
}

if (
    $width !== null &&
    $width !== '' &&
    (!is_numeric($width) || $width < 0)
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid width'
    ]);

    exit;
}

if (
    $height !== null &&
    $height !== '' &&
    (!is_numeric($height) || $height < 0)
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid height'
    ]);

    exit;
}

if (
    !in_array(
        $status,
        ['available', 'unavailable'],
        true
    )
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid status'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Create slug
|--------------------------------------------------------------------------
*/

$slug = strtolower($name);

$slug = preg_replace(
    '/[^a-z0-9]+/',
    '-',
    $slug
);

$slug = trim($slug, '-');

if ($slug === '') {
    $slug = 'painting';
}


/*
|--------------------------------------------------------------------------
| Make slug unique
|--------------------------------------------------------------------------
*/

$baseSlug = $slug;
$counter = 1;

while (true) {

    $slugCheck = $pdo->prepare(
        'SELECT id
         FROM paintings
         WHERE slug = ?
         LIMIT 1'
    );

    $slugCheck->execute([$slug]);

    if (!$slugCheck->fetch()) {
        break;
    }

    $counter++;

    $slug = $baseSlug . '-' . $counter;
}


/*
|--------------------------------------------------------------------------
| Find category
|--------------------------------------------------------------------------
*/

$categoryStmt = $pdo->prepare(
    'SELECT id
     FROM categories
     WHERE name = ?
       AND is_active = 1
     LIMIT 1'
);

$categoryStmt->execute([$categoryName]);

$category = $categoryStmt->fetch();

if (!$category) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Selected category does not exist'
    ]);

    exit;
}

$categoryId = (int) $category['id'];


/*
|--------------------------------------------------------------------------
| Status → database active flag
|--------------------------------------------------------------------------
*/

$isActive = $status === 'available' ? 1 : 0;


/*
|--------------------------------------------------------------------------
| Create painting
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare(
        'INSERT INTO paintings
        (
            artist_id,
            category_id,
            name,
            slug,
            description,
            price,
            discount_price,
            width,
            height,
            medium,
            frame,
            stock,
            is_featured,
            is_active
        )
        VALUES
        (
            NULL,
            ?,
            ?,
            ?,
            ?,
            ?,
            NULL,
            ?,
            ?,
            NULL,
            ?,
            1,
            0,
            ?
        )'
    );

    $stmt->execute([
        $categoryId,
        $name,
        $slug,
        $description !== '' ? $description : null,
        $price,
        $width !== '' ? $width : null,
        $height !== '' ? $height : null,
        $frame !== '' ? $frame : null,
        $isActive
    ]);

    $paintingId = (int) $pdo->lastInsertId();


    /*
    |--------------------------------------------------------------------------
    | Audit log
    |--------------------------------------------------------------------------
    */

    $adminStmt = $pdo->prepare(
        'SELECT email
         FROM admin_users
         WHERE id = ?'
    );

    $adminStmt->execute([$adminId]);

    $admin = $adminStmt->fetch();


    $auditStmt = $pdo->prepare(
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
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )'
    );

    $auditStmt->execute([
        $adminId,
        $admin['email'] ?? null,
        'CREATE',
        'catalogue',
        'painting',
        $paintingId,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        'success' => true,
        'message' => 'Painting created successfully',
        'painting_id' => $paintingId
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to create painting'
    ]);
}