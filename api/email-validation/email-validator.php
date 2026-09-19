<?php

declare(strict_types=1);

function isAllowedEmailDomain(string $email): bool
{
    $email = strtolower(trim($email));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $atPosition = strrpos($email, '@');

    if ($atPosition === false) {
        return false;
    }

    $domain = substr($email, $atPosition + 1);

    // Always allow araha.co.in and all subdomains.
    if ($domain === 'araha.co.in' || str_ends_with($domain, '.araha.co.in')) {
        return true;
    }

    return !isDisposableEmailDomain($domain);
}

function isDisposableEmailDomain(string $domain): bool
{
    static $domains = null;

    $domain = strtolower(trim($domain));

    if ($domain === '') {
        return false;
    }

    if ($domains === null) {
        $file = __DIR__ . '/disposable-domains.txt';

        if (!is_file($file)) {
            // Fail open if the blocklist is temporarily unavailable.
            $domains = [];
        } else {
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            if ($lines === false) {
                $domains = [];
            } else {
                $domains = [];

                foreach ($lines as $line) {
                    $line = strtolower(trim($line));

                    if ($line !== '' && !str_starts_with($line, '#')) {
                        $domains[$line] = true;
                    }
                }
            }
        }
    }

    return isset($domains[$domain]);
}
