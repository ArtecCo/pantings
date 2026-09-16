<?php
declare(strict_types=1);

/**
 * Application-level IP rate limiting.
 *
 * - Admins who are already authenticated and 2FA-verified are never limited.
 * - Painting list loading is intentionally excluded.
 * - CORS preflight requests are not counted.
 * - Login/authentication endpoints use a stricter window.
 * - State is stored under the system temporary directory, not the repository.
 */

if (PHP_SAPI === 'cli') {
    return;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    return;
}

$isAdmin = isset($_SESSION['admin_user_id'])
    && strtolower(trim((string)($_SESSION['admin_user_type'] ?? ''))) === 'admin'
    && (($verified = $_SESSION['admin_2fa_verified'] ?? false) === true
        || $verified === 1
        || $verified === '1'
        || strtolower((string)$verified) === 'true');

if ($isAdmin) {
    return;
}

$path = (string)(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
$normalizedPath = strtolower(rtrim($path, '/'));

// The customer collection calls this endpoint frequently while browsing.
if (preg_match('~/(?:api/)?paintings/list\.php$~', $normalizedPath) === 1) {
    return;
}

$ip = trim((string)($_SERVER['REMOTE_ADDR'] ?? ''));
if ($ip === '') {
    $ip = 'unknown';
}

$isAuthEndpoint = preg_match(
    '~/(?:auth|admin)/(?:login|user-login|register|user-register|request-password-reset|reset-password|request-otp|verify-otp)\.php$~',
    $normalizedPath
) === 1;

$limit = $isAuthEndpoint ? 10 : 120;
$window = $isAuthEndpoint ? 600 : 60;
$bucket = $isAuthEndpoint ? 'auth' : 'api';

$key = hash('sha256', $bucket . '|' . $ip);
$directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'aramane_rate_limits';
$file = $directory . DIRECTORY_SEPARATOR . $key . '.json';

if (!is_dir($directory)) {
    @mkdir($directory, 0700, true);
}

$now = time();
$state = ['window_start' => $now, 'count' => 0];
$handle = @fopen($file, 'c+');

if ($handle === false) {
    // Fail open if the host refuses temporary-file access. This must never turn
    // a rate-limit feature into a site-wide outage.
    return;
}

try {
    if (!flock($handle, LOCK_EX)) {
        return;
    }

    $contents = stream_get_contents($handle);
    if ($contents !== false && trim($contents) !== '') {
        $decoded = json_decode($contents, true);
        if (is_array($decoded)) {
            $state = $decoded;
        }
    }

    $windowStart = (int)($state['window_start'] ?? $now);
    $count = (int)($state['count'] ?? 0);

    if ($windowStart <= 0 || ($now - $windowStart) >= $window) {
        $windowStart = $now;
        $count = 0;
    }

    $count++;

    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode([
        'window_start' => $windowStart,
        'count' => $count,
    ], JSON_UNESCAPED_SLASHES));
    fflush($handle);

    if ($count > $limit) {
        $retryAfter = max(1, $window - ($now - $windowStart));
        header('Retry-After: ' . $retryAfter);
        header('Cache-Control: no-store');
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'rate_limited' => true,
            'message' => 'Too many requests. Please wait a moment and try again.',
            'retry_after' => $retryAfter,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }
} finally {
    flock($handle, LOCK_UN);
    fclose($handle);
}
