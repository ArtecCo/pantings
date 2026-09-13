<?php
require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
$userId=(int)($_SESSION['user_id']??0);
if ($userId<=0 || ($_SESSION['user_type']??'')!=='customer') jsonResponse(['success'=>false,'message'=>'User authentication required'],401);
$data=requestJson();
$paintingId=(int)($data['painting_id']??0);
$quantity=max(1,(int)($data['quantity']??1));
if ($paintingId<=0) jsonResponse(['success'=>false,'message'=>'Invalid painting'],422);
try {
 $stmt=$pdo->prepare('SELECT id,name,price,discount_price,stock,is_active FROM paintings WHERE id=? LIMIT 1');
 $stmt->execute([$paintingId]); $painting=$stmt->fetch();
 if (!$painting || !(int)$painting['is_active']) jsonResponse(['success'=>false,'message'=>'Painting is unavailable'],404);
 if ((int)$painting['stock'] < $quantity) jsonResponse(['success'=>false,'message'=>'Requested quantity is not available'],409);
 $stmt=$pdo->prepare('SELECT id,quantity FROM cart_items WHERE user_id=? AND painting_id=? LIMIT 1');
 $stmt->execute([$userId,$paintingId]); $existing=$stmt->fetch();
 if ($existing) {
   $newQty=(int)$existing['quantity']+$quantity;
   if ($newQty>(int)$painting['stock']) jsonResponse(['success'=>false,'message'=>'Requested quantity is not available'],409);
   $stmt=$pdo->prepare('UPDATE cart_items SET quantity=?, updated_at=NOW() WHERE id=?');
   $stmt->execute([$newQty,(int)$existing['id']]); $cartItemId=(int)$existing['id'];
 } else {
   $stmt=$pdo->prepare('INSERT INTO cart_items (user_id,painting_id,quantity) VALUES (?,?,?)');
   $stmt->execute([$userId,$paintingId,$quantity]); $cartItemId=(int)$pdo->lastInsertId();
 }
 jsonResponse(['success'=>true,'cart_item_id'=>$cartItemId,'message'=>'Painting added to cart']);
} catch(Throwable $e) { error_log('Cart add error: '.$e->getMessage()); jsonResponse(['success'=>false,'message'=>'Unable to add painting to cart'],500); }
