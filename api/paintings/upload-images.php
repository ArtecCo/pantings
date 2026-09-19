<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';
require_once __DIR__ . '/../cache/paintings-cache.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $paintingId = (int)($_POST['painting_id'] ?? 0);
    if ($paintingId <= 0) adminJsonResponse(['success' => false, 'message' => 'Invalid painting ID'], 400);
    $check = $pdo->prepare('SELECT id FROM paintings WHERE id=? LIMIT 1');
    $check->execute([$paintingId]);
    if (!$check->fetch()) adminJsonResponse(['success' => false, 'message' => 'Painting not found'], 404);
    if (!isset($_FILES['images'])) adminJsonResponse(['success' => false, 'message' => 'No images were uploaded'], 400);
    $files = $_FILES['images'];
    $count = is_array($files['name'] ?? null) ? count($files['name']) : 0;
    if ($count === 0) adminJsonResponse(['success' => false, 'message' => 'No images were uploaded'], 400);

    $uploadDirectory = __DIR__ . '/uploads';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) throw new RuntimeException('Unable to create image upload directory');
    $allowedMimeTypes = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
    $orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order),-1)+1 FROM painting_images WHERE painting_id=?');
    $orderStmt->execute([$paintingId]);
    $sortOrder = (int)$orderStmt->fetchColumn();
    $results=[]; $createdFiles=[];

    $pdo->beginTransaction();
    for($i=0;$i<$count;$i++){
        if(($files['error'][$i] ?? UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK) throw new RuntimeException('One of the images could not be uploaded');
        if((int)$files['size'][$i]>10*1024*1024) throw new RuntimeException('Each image must be 10 MB or smaller');
        $tmpName=$files['tmp_name'][$i];
        if(!is_uploaded_file($tmpName)) throw new RuntimeException('Invalid uploaded image');
        if(getimagesize($tmpName)===false) throw new RuntimeException('One of the uploaded files is not a valid image');
        $finfo=finfo_open(FILEINFO_MIME_TYPE); $mimeType=finfo_file($finfo,$tmpName); finfo_close($finfo);
        if(!isset($allowedMimeTypes[$mimeType])) throw new RuntimeException('Only JPG, PNG and WebP images are allowed');
        $filename='painting_'.$paintingId.'_'.bin2hex(random_bytes(12)).'.'.$allowedMimeTypes[$mimeType];
        $destination=$uploadDirectory.'/'.$filename;
        if(!move_uploaded_file($tmpName,$destination)) throw new RuntimeException('Unable to save uploaded image');
        $createdFiles[]=$destination;
        $imageUrl='/paintings/uploads/'.$filename;
        $insert=$pdo->prepare('INSERT INTO painting_images (painting_id,image_url,sort_order,is_primary) VALUES (?,?,?,?)');
        $insert->execute([$paintingId,$imageUrl,$sortOrder,0]);
        $results[]=['id'=>(int)$pdo->lastInsertId(),'image_url'=>$imageUrl,'sort_order'=>$sortOrder,'is_primary'=>0];
        $sortOrder++;
    }
    $pdo->commit();

    // The cache was generated when the painting was created. Regenerate here
    // as well so the catalogue immediately includes newly uploaded images.
    writePaintingsCache($pdo);

    adminJsonResponse(['success'=>true,'message'=>'Images uploaded successfully','images'=>$results]);
} catch(Throwable $e){
    if($pdo->inTransaction()) $pdo->rollBack();
    if(!empty($createdFiles)) foreach($createdFiles as $file) if(is_file($file)) @unlink($file);
    error_log('Painting image upload error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>$e->getMessage()],400);
}
