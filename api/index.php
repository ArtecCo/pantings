<?php

require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'Araha Arts API is up and running',
]);