<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/require-admin.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
}

try {
    $adminId=(int)$_SESSION['admin_user_id'];
    $adminEmail=$_SESSION['admin_email']??null;
    $input=json_decode(file_get_contents('php://input'),true);

    if (!is_array($input)) {
        throw new Exception('Invalid request data');
    }

    $id=isset($input['id'])?(int)$input['id']:0;
    if ($id<=0) throw new Exception('Invalid painting ID');

    $name=trim((string)($input['name']??''));
    $category=trim((string)($input['category']??''));
    $description=trim((string)($input['description']??''));
    $price=$input['price']??'';
    $width=$input['width']??'';
    $height=$input['height']??'';
    $frame=trim((string)($input['frame']??''));
    $goldDetails=trim((string)($input['goldDetails']??''));
    $status=$input['status']??'available';

    if ($name==='') throw new Exception('Painting name is required');
    if ($category==='') throw new Exception('Category is required');
    if ($price===''||!is_numeric($price)||(float)$price<0) throw new Exception('Valid price is required');
    if ($width===''||!is_numeric($width)||(float)$width<=0) throw new Exception('Valid width is required');
    if ($height===''||!is_numeric($height)||(float)$height<=0) throw new Exception('Valid height is required');
    if (!in_array($status,['available','unavailable'],true)) throw new Exception('Invalid painting status');

    $categoryStmt=$pdo->prepare('SELECT id FROM categories WHERE name=? LIMIT 1');
    $categoryStmt->execute([$category]);
    $categoryRow=$categoryStmt->fetch();
    if (!$categoryRow) throw new Exception('Selected category was not found');
    $categoryId=(int)$categoryRow['id'];

    $existingStmt=$pdo->prepare('SELECT id FROM paintings WHERE id=? LIMIT 1');
    $existingStmt->execute([$id]);
    if (!$existingStmt->fetch()) {
        adminJsonResponse(['success'=>false,'message'=>'Painting not found'],404);
    }

    $baseSlug=strtolower(trim($name));
    $baseSlug=preg_replace('/[^a-z0-9]+/i','-',$baseSlug);
    $baseSlug=trim($baseSlug,'-');
    if ($baseSlug==='') $baseSlug='painting';

    $slug=$baseSlug;
    $slugStmt=$pdo->prepare('SELECT id FROM paintings WHERE slug=? AND id<>? LIMIT 1');
    $counter=2;
    while (true) {
        $slugStmt->execute([$slug,$id]);
        if (!$slugStmt->fetch()) break;
        $slug=$baseSlug.'-'.$counter;
        $counter++;
    }

    $isActive=$status==='available'?1:0;
    $updateStmt=$pdo->prepare('UPDATE paintings SET category_id=?,name=?,slug=?,description=?,price=?,width=?,height=?,frame=?,gold_details=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?');
    $updateStmt->execute([
        $categoryId,$name,$slug,
        $description!==''?$description:null,
        (float)$price,(float)$width,(float)$height,
        $frame!==''?$frame:null,
        $goldDetails!==''?$goldDetails:null,
        $isActive,$id
    ]);

    $auditStmt=$pdo->prepare('INSERT INTO audit_logs (admin_user_id,admin_email,action,module,record_type,record_id,ip_address,user_agent) VALUES (?,?,?,?,?,?,?,?)');
    $auditStmt->execute([
        $adminId,$adminEmail,'UPDATE','catalogue','painting',$id,
        $_SERVER['REMOTE_ADDR']??null,$_SERVER['HTTP_USER_AGENT']??null
    ]);

    adminJsonResponse(['success'=>true,'message'=>'Painting updated successfully','painting_id'=>$id]);
} catch (Throwable $e) {
    error_log('Painting update error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>$e->getMessage()],500);
}
