<?php
declare(strict_types=1);
require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';
requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];
try {
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT id, question, answer, sort_order, is_active, created_at, updated_at FROM faqs ORDER BY sort_order ASC, id ASC');
        adminJsonResponse(['success'=>true,'faqs'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if (!in_array($method, ['POST','PUT','DELETE'], true)) adminJsonResponse(['success'=>false,'message'=>'Method not allowed'],405);
    $data = adminRequestJson();
    $id = (int)($data['id'] ?? 0);
    if ($method === 'POST') {
        $question = trim((string)($data['question'] ?? ''));
        $answer = trim((string)($data['answer'] ?? ''));
        $sortOrder = (int)($data['sort_order'] ?? 0);
        $isActive = !empty($data['is_active']) ? 1 : 0;
        if ($question === '' || $answer === '') adminJsonResponse(['success'=>false,'message'=>'Question and answer are required'],422);
        $stmt=$pdo->prepare('INSERT INTO faqs (question,answer,sort_order,is_active) VALUES (?,?,?,?)');
        $stmt->execute([$question,$answer,$sortOrder,$isActive]);
        adminJsonResponse(['success'=>true,'message'=>'FAQ added successfully','id'=>(int)$pdo->lastInsertId()]);
    }
    if ($id <= 0) adminJsonResponse(['success'=>false,'message'=>'Invalid FAQ'],422);
    $check=$pdo->prepare('SELECT id FROM faqs WHERE id=? LIMIT 1');
    $check->execute([$id]);
    if (!$check->fetch()) adminJsonResponse(['success'=>false,'message'=>'FAQ not found'],404);
    if ($method === 'DELETE') {
        $pdo->prepare('DELETE FROM faqs WHERE id=?')->execute([$id]);
        adminJsonResponse(['success'=>true,'message'=>'FAQ deleted successfully']);
    }
    $question=trim((string)($data['question'] ?? ''));
    $answer=trim((string)($data['answer'] ?? ''));
    $sortOrder=(int)($data['sort_order'] ?? 0);
    $isActive=!empty($data['is_active']) ? 1 : 0;
    if ($question === '' || $answer === '') adminJsonResponse(['success'=>false,'message'=>'Question and answer are required'],422);
    $stmt=$pdo->prepare('UPDATE faqs SET question=?,answer=?,sort_order=?,is_active=? WHERE id=?');
    $stmt->execute([$question,$answer,$sortOrder,$isActive,$id]);
    adminJsonResponse(['success'=>true,'message'=>'FAQ updated successfully']);
} catch (Throwable $e) {
    error_log('FAQ admin error: '.$e->getMessage());
    adminJsonResponse(['success'=>false,'message'=>'Unable to save FAQs'],500);
}
