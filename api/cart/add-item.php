<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$userId=requireCustomer();$data=requestJson();$paintingId=(int)($data['painting_id']??0);$quantity=filter_var($data['quantity']??1,FILTER_VALIDATE_INT);
if($paintingId<=0)jsonResponse(['success'=>false,'message'=>'Invalid painting'],422);if($quantity===false||$quantity<1)jsonResponse(['success'=>false,'message'=>'Quantity must be at least 1'],422);
try{
 $stmt=$pdo->prepare('SELECT id,is_active FROM paintings WHERE id=? LIMIT 1');$stmt->execute([$paintingId]);$painting=$stmt->fetch();if(!$painting||!(int)$painting['is_active'])jsonResponse(['success'=>false,'message'=>'Painting is unavailable'],404);
 $sizeStmt=$pdo->prepare('SELECT id FROM painting_size_options WHERE painting_id=? ORDER BY is_standard DESC,sort_order ASC,id ASC LIMIT 1');$sizeStmt->execute([$paintingId]);$size=$sizeStmt->fetch();$sizeOptionId=$size?(int)$size['id']:null;
 $pdo->beginTransaction();$stmt=$pdo->prepare('SELECT id FROM carts WHERE user_id=? LIMIT 1 FOR UPDATE');$stmt->execute([$userId]);$cart=$stmt->fetch();
 if(!$cart){$stmt=$pdo->prepare('INSERT INTO carts(user_id) VALUES(?)');$stmt->execute([$userId]);$cartId=(int)$pdo->lastInsertId();}else{$cartId=(int)$cart['id'];}
 $stmt=$pdo->prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND painting_id=? LIMIT 1 FOR UPDATE');$stmt->execute([$cartId,$paintingId]);$existing=$stmt->fetch();
 if($existing){$stmt=$pdo->prepare('UPDATE cart_items SET quantity=?,size_option_id=COALESCE(size_option_id,?) WHERE id=? AND cart_id=?');$stmt->execute([(int)$existing['quantity']+$quantity,$sizeOptionId,(int)$existing['id'],$cartId]);$cartItemId=(int)$existing['id'];}
 else{$stmt=$pdo->prepare('INSERT INTO cart_items(cart_id,painting_id,size_option_id,quantity) VALUES(?,?,?,?)');$stmt->execute([$cartId,$paintingId,$sizeOptionId,$quantity]);$cartItemId=(int)$pdo->lastInsertId();}
 $pdo->commit();jsonResponse(['success'=>true,'cart_item_id'=>$cartItemId,'message'=>'Painting added to cart']);
}catch(PDOException $e){if($pdo->inTransaction())$pdo->rollBack();if((string)$e->getCode()==='23000')jsonResponse(['success'=>false,'message'=>'This painting is already in your cart. Please try again.'],409);error_log('Cart add error: '.$e->getMessage());jsonResponse(['success'=>false,'message'=>'Unable to add painting to cart'],500);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('Cart add error: '.$e->getMessage());jsonResponse(['success'=>false,'message'=>'Unable to add painting to cart'],500);}
