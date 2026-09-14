<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$userId=(int)($_SESSION['user_id']??0);
if ($userId<=0 || ($_SESSION['user_type']??'')!=='customer') jsonResponse(['success'=>false,'message'=>'User authentication required'],401);

try {
    $stmt=$pdo->prepare('SELECT ci.id AS cart_item_id,ci.painting_id,ci.size_option_id,ci.quantity,p.name,p.slug,p.price,p.discount_price,p.stock,p.is_active,c.name AS category_name,pi.image_url FROM cart_items ci INNER JOIN carts cart ON cart.id=ci.cart_id INNER JOIN paintings p ON p.id=ci.painting_id LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN painting_images pi ON pi.id=(SELECT pi2.id FROM painting_images pi2 WHERE pi2.painting_id=p.id ORDER BY pi2.is_primary DESC,pi2.sort_order ASC,pi2.id ASC LIMIT 1) WHERE cart.user_id=? ORDER BY ci.id ASC');
    $stmt->execute([$userId]);
    $items=$stmt->fetchAll(PDO::FETCH_ASSOC);
    $optionStmt=$pdo->prepare('SELECT id,name,width,height,unit,price,is_standard,sort_order FROM painting_size_options WHERE painting_id=? ORDER BY sort_order ASC,id ASC');
    foreach($items as &$item){
        $item['cart_item_id']=(int)$item['cart_item_id'];$item['painting_id']=(int)$item['painting_id'];$item['size_option_id']=$item['size_option_id']!==null?(int)$item['size_option_id']:null;$item['quantity']=(int)$item['quantity'];$item['stock']=(int)$item['stock'];
        $optionStmt->execute([(int)$item['painting_id']]);
        $rawOptions=$optionStmt->fetchAll(PDO::FETCH_ASSOC);
        $uniqueOptions=[];
        foreach($rawOptions as $option){
            $key=strtolower(trim((string)$option['name'])).'|'.number_format((float)$option['width'],2,'.','').'|'.number_format((float)$option['height'],2,'.','').'|'.strtolower(trim((string)$option['unit'])).'|'.number_format((float)$option['price'],2,'.','');
            if(isset($uniqueOptions[$key])) continue;
            $option['id']=(int)$option['id'];$option['is_standard']=(int)$option['is_standard'];$uniqueOptions[$key]=$option;
        }
        $item['size_options']=array_values($uniqueOptions);
    }
    unset($item); jsonResponse(['success'=>true,'items'=>$items]);
} catch(Throwable $e){error_log('Cart get error: '.$e->getMessage());jsonResponse(['success'=>false,'message'=>'Unable to load your cart'],500);}
