<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    $stmt = $pdo->query('SELECT id, question, answer FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    jsonResponse(['success' => true, 'faqs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $e) {
    error_log('FAQ list error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Unable to load FAQs'], 500);
}
