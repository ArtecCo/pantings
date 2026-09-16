<?php
declare(strict_types=1);

// Server-side SEO wrapper for Apache crawlers/social previews.
// React remains responsible for the normal browser experience.

$indexFile = __DIR__ . '/index.html';
$html = is_file($indexFile) ? (string) file_get_contents($indexFile) : '';

if ($html === '') {
    http_response_code(500);
    exit('Unable to load application.');
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$paintingId = 0;

if (preg_match('#^/paintings/(\d+)/?$#', $path, $matches)) {
    $paintingId = (int) $matches[1];
}

if ($paintingId > 0) {
    $apiUrl = 'https://api.arts.araha.co.in/paintings/get.php?id=' . rawurlencode((string) $paintingId);
    $json = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_USERAGENT => 'ARAmane Arts SEO Preview',
        ]);
        $json = curl_exec($ch);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'timeout' => 5,
                'user_agent' => 'ARAmane Arts SEO Preview',
            ],
        ]);
        $json = @file_get_contents($apiUrl, false, $context);
    }

    $data = is_string($json) ? json_decode($json, true) : null;
    $painting = is_array($data) ? ($data['painting'] ?? null) : null;
    $paintingName = is_array($painting) ? trim((string) ($painting['name'] ?? '')) : '';

    if ($paintingName !== '') {
        $title = $paintingName . ' | ARAmane Arts';
        $pageUrl = 'https://arts.araha.co.in' . $path;
        $escapedTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $escapedUrl = htmlspecialchars($pageUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $html = preg_replace(
            '/<title>.*?<\/title>/is',
            '<title>' . $escapedTitle . '</title>',
            $html,
            1
        ) ?? $html;

        $html = preg_replace(
            '/(<meta\s+property=["\']og:title["\']\s+content=["\']).*?(["\'][^>]*>)/is',
            '$1' . $escapedTitle . '$2',
            $html,
            1
        ) ?? $html;

        $html = preg_replace(
            '/(<meta\s+property=["\']og:url["\']\s+content=["\']).*?(["\'][^>]*>)/is',
            '$1' . $escapedUrl . '$2',
            $html,
            1
        ) ?? $html;

        $html = preg_replace(
            '/(<meta\s+name=["\']twitter:title["\']\s+content=["\']).*?(["\'][^>]*>)/is',
            '$1' . $escapedTitle . '$2',
            $html,
            1
        ) ?? $html;

        $html = preg_replace(
            '/(<link\s+rel=["\']canonical["\']\s+href=["\']).*?(["\'][^>]*>)/is',
            '$1' . $escapedUrl . '$2',
            $html,
            1
        ) ?? $html;
    }
}

header('Content-Type: text/html; charset=UTF-8');
echo $html;
