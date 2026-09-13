<?php
// Set GOOGLE_CLIENT_ID in the PHP environment on the server.
// Do not put a Google client secret in the frontend or repository.
$googleClientId = trim((string)(getenv('GOOGLE_CLIENT_ID') ?: ''));
