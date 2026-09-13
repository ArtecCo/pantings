<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);

    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    /*
     * Read access is public.
     *
     * Customers should only receive active categories.
     * Admins receive all categories so inactive categories
     * remain manageable from the admin portal.
     */
    $isAdmin = isset($_SESSION['admin_user_id']);

    if ($isAdmin) {
        $sql = "
            SELECT
                id,
                name,
                slug,
                description,
                is_active,
                created_at,
                updated_at
            FROM categories
            ORDER BY name ASC
        ";

        $stmt = $pdo->prepare($sql);
    } else {
        $sql = "
            SELECT
                id,
                name,
                slug,
                description,
                is_active,
                created_at,
                updated_at
            FROM categories
            WHERE is_active = 1
            ORDER BY name ASC
        ";

        $stmt = $pdo->prepare($sql);
    }

    $stmt->execute();

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);

} catch (PDOException $e) {
    error_log('Categories list error: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to load categories'
    ]);
}