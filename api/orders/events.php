<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth/_common.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId = requireCustomer();

// Release the PHP session lock before keeping this SSE connection open.
session_write_close();

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

@set_time_limit(0);
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', '0');

while (ob_get_level() > 0) {
    @ob_end_flush();
}

function sseSend(string $event, array $data): void {
    echo "event: {$event}\n";
    echo 'data: ' . json_encode($data, JSON_UNESCAPED_SLASHES) . "\n\n";
    @flush();
}

function getOrderMarker(PDO $pdo, int $userId): ?array {
    $stmt = $pdo->prepare(
        'SELECT id, status, updated_at
         FROM orders
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1'
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return null;
    }

    return [
        'id' => (int)$row['id'],
        'status' => (string)$row['status'],
        'updated_at' => (string)$row['updated_at'],
    ];
}

try {
    $marker = getOrderMarker($pdo, $userId);
    sseSend('ready', ['order' => $marker]);

    $startedAt = microtime(true);
    $maxConnectionSeconds = 25;
    $pollSeconds = 2;
    $heartbeatSeconds = 12;
    $lastHeartbeat = microtime(true);

    while ((microtime(true) - $startedAt) < $maxConnectionSeconds) {
        if (connection_aborted()) {
            break;
        }

        sleep($pollSeconds);

        $current = getOrderMarker($pdo, $userId);
        if ($current !== $marker) {
            $marker = $current;
            sseSend('order.updated', [
                'order' => $current,
                'message' => 'Your order has been updated.',
            ]);
        }

        if ((microtime(true) - $lastHeartbeat) >= $heartbeatSeconds) {
            echo ": heartbeat\n\n";
            @flush();
            $lastHeartbeat = microtime(true);
        }
    }
} catch (Throwable $e) {
    error_log('Order SSE error: ' . $e->getMessage());
    sseSend('error', ['message' => 'Order updates temporarily unavailable.']);
}
