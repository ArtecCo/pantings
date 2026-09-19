<?php
declare(strict_types=1);

// const PAINTINGS_CACHE_TTL = 600;

function paintingsCachePath(): string
{
    return __DIR__ . '/paintings.json';
}

function paintingsCachePayloadFromDatabase(PDO $pdo): array
{
    $sql = 'SELECT p.id,p.category_id,p.name,p.slug,p.description,p.price,p.discount_price,p.width,p.height,p.medium,p.frame,p.gold_details,p.stock,p.is_featured,p.is_active,p.created_at,c.name AS category_name
            FROM paintings p
            LEFT JOIN categories c ON c.id=p.category_id
            WHERE p.is_active=1
            ORDER BY p.created_at DESC';

    $paintings = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    $byId = [];
    $ids = [];

    foreach ($paintings as $index => &$painting) {
        $id = (int)$painting['id'];
        $painting['images'] = [];
        $painting['image_url'] = null;
        $painting['size_options'] = [];
        $byId[$id] = $index;
        $ids[] = $id;
    }
    unset($painting);

    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $imageStmt = $pdo->prepare(
            "SELECT id,painting_id,image_url,sort_order,is_primary
             FROM painting_images
             WHERE painting_id IN ($placeholders)
             ORDER BY sort_order ASC,id ASC"
        );
        $imageStmt->execute($ids);

        while ($image = $imageStmt->fetch(PDO::FETCH_ASSOC)) {
            $paintingId = (int)$image['painting_id'];
            if (!isset($byId[$paintingId])) {
                continue;
            }
            $index = $byId[$paintingId];
            $paintings[$index]['images'][] = [
                'id' => (int)$image['id'],
                'image_url' => $image['image_url'],
                'sort_order' => (int)$image['sort_order'],
                'is_primary' => (int)$image['is_primary'],
            ];
            if ($paintings[$index]['image_url'] === null) {
                $paintings[$index]['image_url'] = $image['image_url'];
            }
        }

        $sizeStmt = $pdo->prepare(
            "SELECT id,painting_id,name,width,height,unit,price,is_standard,sort_order
             FROM painting_size_options
             WHERE painting_id IN ($placeholders)
             ORDER BY sort_order ASC,id ASC"
        );
        $sizeStmt->execute($ids);

        while ($size = $sizeStmt->fetch(PDO::FETCH_ASSOC)) {
            $paintingId = (int)$size['painting_id'];
            if (!isset($byId[$paintingId])) {
                continue;
            }
            $index = $byId[$paintingId];
            $paintings[$index]['size_options'][] = [
                'id' => (int)$size['id'],
                'name' => $size['name'],
                'width' => $size['width'],
                'height' => $size['height'],
                'unit' => $size['unit'],
                'price' => $size['price'],
                'is_standard' => (int)$size['is_standard'],
                'sort_order' => (int)$size['sort_order'],
            ];
        }
    }

    return [
        'success' => true,
        'generated_at' => gmdate('c'),
        'paintings' => $paintings,
    ];
}

function writePaintingsCache(PDO $pdo): array
{
    $directory = __DIR__;
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('Unable to create paintings cache directory');
    }

    $payload = paintingsCachePayloadFromDatabase($pdo);
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        throw new RuntimeException('Unable to encode paintings cache');
    }

    $cachePath = paintingsCachePath();
    $temporaryPath = tempnam($directory, 'paintings-');
    if ($temporaryPath === false) {
        throw new RuntimeException('Unable to create temporary paintings cache');
    }

    try {
        if (file_put_contents($temporaryPath, $json, LOCK_EX) === false) {
            throw new RuntimeException('Unable to write paintings cache');
        }
        if (!rename($temporaryPath, $cachePath)) {
            throw new RuntimeException('Unable to publish paintings cache');
        }
    } finally {
        if (is_file($temporaryPath)) {
            @unlink($temporaryPath);
        }
    }

    return $payload;
}

// function readFreshPaintingsCache(): ?array
// {
//     $cachePath = paintingsCachePath();
//     if (!is_file($cachePath)) {
//         return null;
//     }

//     clearstatcache(true, $cachePath);
//     $modifiedAt = filemtime($cachePath);
//     if ($modifiedAt === false || (time() - $modifiedAt) > PAINTINGS_CACHE_TTL) {
//         return null;
//     }

//     $contents = @file_get_contents($cachePath);
//     if ($contents === false || $contents === '') {
//         return null;
//     }

//     $payload = json_decode($contents, true);
//     if (!is_array($payload) || ($payload['success'] ?? false) !== true || !isset($payload['paintings']) || !is_array($payload['paintings'])) {
//         return null;
//     }

//     return $payload;
// }


function readPaintingsCache(): ?array
{
    $cachePath = paintingsCachePath();

    if (!is_file($cachePath)) {
        return null;
    }

    $contents = @file_get_contents($cachePath);

    if ($contents === false || $contents === '') {
        return null;
    }

    $payload = json_decode($contents, true);

    if (
        !is_array($payload) ||
        ($payload['success'] ?? false) !== true ||
        !isset($payload['paintings']) ||
        !is_array($payload['paintings'])
    ) {
        return null;
    }

    return $payload;
}

// function getPaintingsWithCache(PDO $pdo): array
// {
//     $cached = readFreshPaintingsCache();
//     if ($cached !== null) {
//         return $cached;
//     }

//     return writePaintingsCache($pdo);
// }


function getPaintingsWithCache(PDO $pdo): array
{
    $cached = readPaintingsCache();

    if ($cached !== null) {
        return $cached;
    }

    return writePaintingsCache($pdo);
}