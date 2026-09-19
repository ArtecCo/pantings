<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../cache/paintings-cache.php';

$isAdmin = isset($_SESSION['admin_user_id'])
    && ($_SESSION['admin_user_type'] ?? '') === 'admin'
    && ($_SESSION['admin_2fa_verified'] ?? false) === true;

try {
    // Administrators must always see live database data. Customers use the
    // short-lived JSON cache to avoid opening a database connection on hits.
    if (!$isAdmin) {
        $cached = readFreshPaintingsCache();
        if ($cached !== null) {
            adminJsonResponse($cached);
        }
    }

    require_once __DIR__ . '/../config/database.php';

    if (!$isAdmin) {
        $payload = writePaintingsCache($pdo);
        adminJsonResponse($payload);
    }

    $sql = 'SELECT p.id,p.category_id,p.name,p.slug,p.description,p.price,p.discount_price,p.width,p.height,p.medium,p.frame,p.gold_details,p.stock,p.is_featured,p.is_active,p.created_at,c.name AS category_name FROM paintings p LEFT JOIN categories c ON c.id=p.category_id';
    $sql .= ' ORDER BY p.created_at DESC';
    $paintings = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    $imageStmt = $pdo->prepare('SELECT id,image_url,sort_order,is_primary FROM painting_images WHERE painting_id=? ORDER BY sort_order ASC,id ASC');
    $sizeStmt = $pdo->prepare('SELECT id,name,width,height,unit,price,is_standard,sort_order FROM painting_size_options WHERE painting_id=? ORDER BY sort_order ASC,id ASC');

    foreach ($paintings as &$painting) {
        $imageStmt->execute([$painting['id']]);
        $painting['images'] = $imageStmt->fetchAll(PDO::FETCH_ASSOC);
        $painting['image_url'] = !empty($painting['images']) ? $painting['images'][0]['image_url'] : null;

        $sizeStmt->execute([$painting['id']]);
        $painting['size_options'] = $sizeStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($painting);

    adminJsonResponse(['success'=>true,'paintings'=>$paintings]);
} catch (Throwable $e) {
    error_log('Painting list error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>'Unable to load paintings'],500);
}
