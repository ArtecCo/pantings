<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:5174");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

try {

    $paintingId = (int)($_POST['painting_id'] ?? 0);

    if ($paintingId <= 0) {
        throw new Exception('Invalid painting ID');
    }

    $check = $pdo->prepare("
        SELECT id
        FROM paintings
        WHERE id = ?
        LIMIT 1
    ");

    $check->execute([$paintingId]);

    if (!$check->fetch()) {
        http_response_code(404);
        throw new Exception('Painting not found');
    }

    if (!isset($_FILES['images'])) {
        throw new Exception('No images were uploaded');
    }

    $files = $_FILES['images'];

    $uploadDirectory = __DIR__ . '/uploads';

    if (!is_dir($uploadDirectory)) {
        mkdir($uploadDirectory, 0755, true);
    }

    $count = is_array($files['name'])
        ? count($files['name'])
        : 0;

    if ($count === 0) {
        throw new Exception('No images were uploaded');
    }

    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp'
    ];

    $results = [];

    $orderStmt = $pdo->prepare("
        SELECT COALESCE(MAX(sort_order), -1) + 1
        FROM painting_images
        WHERE painting_id = ?
    ");

    $orderStmt->execute([$paintingId]);

    $sortOrder = (int)$orderStmt->fetchColumn();

    $pdo->beginTransaction();

    for ($i = 0; $i < $count; $i++) {

        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            throw new Exception(
                'One of the images could not be uploaded'
            );
        }

        if ($files['size'][$i] > 10 * 1024 * 1024) {
            throw new Exception(
                'Each image must be 10 MB or smaller'
            );
        }

        $tmpName = $files['tmp_name'][$i];

        $imageInfo = getimagesize($tmpName);

        if ($imageInfo === false) {
            throw new Exception(
                'One of the uploaded files is not a valid image'
            );
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        if (!isset($allowedMimeTypes[$mimeType])) {
            throw new Exception(
                'Only JPG, PNG and WebP images are allowed'
            );
        }

        $extension = $allowedMimeTypes[$mimeType];

        $filename =
            'painting_' .
            $paintingId .
            '_' .
            bin2hex(random_bytes(12)) .
            '.' .
            $extension;

        $destination = $uploadDirectory . '/' . $filename;

        if (!move_uploaded_file($tmpName, $destination)) {
            throw new Exception(
                'Unable to save uploaded image'
            );
        }

        $imageUrl =
            '/paintings/api/paintings/uploads/' .
            $filename;

        $insert = $pdo->prepare("
            INSERT INTO painting_images
            (
                painting_id,
                image_url,
                sort_order,
                is_primary
            )
            VALUES (?, ?, ?, ?)
        ");

        $isPrimary = 0;

        $insert->execute([
            $paintingId,
            $imageUrl,
            $sortOrder,
            $isPrimary
        ]);

        $results[] = [
            'id' => $pdo->lastInsertId(),
            'image_url' => $imageUrl,
            'sort_order' => $sortOrder
        ];

        $sortOrder++;
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Images uploaded successfully',
        'images' => $results
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Painting image upload error: ' . $e->getMessage());

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}