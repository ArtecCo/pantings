<?php
declare(strict_types=1);
require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $input=adminRequestJson();
    $imageId=(int)($input['image_id']??0);
    if($imageId<=0) adminJsonResponse(['success'=>false,'message'=>'Invalid image ID'],400);

    $stmt=$pdo->prepare('SELECT id,painting_id,image_url,is_primary FROM painting_images WHERE id=? LIMIT 1');
    $stmt->execute([$imageId]);
    $image=$stmt->fetch(PDO::FETCH_ASSOC);
    if(!$image) adminJsonResponse(['success'=>false,'message'=>'Image not found'],404);

    $relativePath=(string)$image['image_url'];
    $prefix='/paintings/api/paintings/';
    $filePath=null;
    if(strpos($relativePath,$prefix)===0){
        $filename=substr($relativePath,strlen($prefix));
        $candidate=realpath(__DIR__.'/'.$filename);
        $uploadRoot=realpath(__DIR__.'/uploads');
        if($candidate!==false && $uploadRoot!==false && strncmp($candidate,$uploadRoot.DIRECTORY_SEPARATOR,strlen($uploadRoot.DIRECTORY_SEPARATOR))===0) $filePath=$candidate;
    }

    if($filePath!==null && is_file($filePath) && !@unlink($filePath)) throw new RuntimeException('Unable to delete the uploaded image file');

    $pdo->beginTransaction();
    $delete=$pdo->prepare('DELETE FROM painting_images WHERE id=?');
    $delete->execute([$imageId]);
    if($delete->rowCount()!==1) throw new RuntimeException('Unable to delete image record');

    if((int)$image['is_primary']===1){
        $next=$pdo->prepare('SELECT id FROM painting_images WHERE painting_id=? ORDER BY sort_order ASC,id ASC LIMIT 1');
        $next->execute([(int)$image['painting_id']]);
        $nextImage=$next->fetch(PDO::FETCH_ASSOC);
        if($nextImage) $pdo->prepare('UPDATE painting_images SET is_primary=1 WHERE id=?')->execute([(int)$nextImage['id']]);
    }
    $pdo->commit();
    adminJsonResponse(['success'=>true,'message'=>'Image deleted successfully']);
} catch(Throwable $e){
    if($pdo->inTransaction()) $pdo->rollBack();
    error_log('Painting image delete error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>$e->getMessage()],400);
}
