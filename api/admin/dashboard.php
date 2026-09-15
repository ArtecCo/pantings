<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/_common.php';
require_once __DIR__ . '/../config/database.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    adminJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

try {
    // Keep dashboard statistics compatible with databases created before later
    // order/user schema additions. Every metric is queried independently so one
    // optional column cannot make the entire dashboard return HTTP 500.
    $tableExists = static function (PDO $pdo, string $table): bool {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?'
        );
        $stmt->execute([$table]);
        return (int) $stmt->fetchColumn() > 0;
    };

    $columnExists = static function (PDO $pdo, string $table, string $column): bool {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'
        );
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    };

    $pending = 0;
    if ($tableExists($pdo, 'orders') && $columnExists($pdo, 'orders', 'status')) {
        $pending = (int) $pdo->query(
            "SELECT COUNT(*) FROM orders WHERE status = 'PENDING_ACCEPTANCE'"
        )->fetchColumn();
    }

    $paintings = 0;
    if ($tableExists($pdo, 'paintings')) {
        $paintings = (int) $pdo->query('SELECT COUNT(*) FROM paintings')->fetchColumn();
    }

    $customers = 0;
    if ($tableExists($pdo, 'users')) {
        if ($columnExists($pdo, 'users', 'user_type')) {
            $customers = (int) $pdo->query(
                "SELECT COUNT(*) FROM users WHERE user_type = 'customer'"
            )->fetchColumn();
        } else {
            $customers = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        }
    }

    $revenue = 0.0;
    if ($tableExists($pdo, 'orders') && $columnExists($pdo, 'orders', 'status')) {
        $revenueColumn = $columnExists($pdo, 'orders', 'total_amount')
            ? 'total_amount'
            : ($columnExists($pdo, 'orders', 'base_amount') ? 'base_amount' : null);

        if ($revenueColumn !== null) {
            $revenue = (float) $pdo->query(
                "SELECT COALESCE(SUM($revenueColumn), 0) FROM orders WHERE status IN ('PAID','PROCESSING','DISPATCHED','DELIVERED')"
            )->fetchColumn();
        }
    }

    adminJsonResponse([
        'success' => true,
        'pending_orders' => $pending,
        'paintings' => $paintings,
        'customers' => $customers,
        'revenue' => $revenue,
    ]);
} catch (Throwable $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    adminJsonResponse(['success' => false, 'message' => 'Unable to load dashboard statistics'], 500);
}
