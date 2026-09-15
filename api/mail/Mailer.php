<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

$manualBase = __DIR__ . '/../lib/PHPMailer/src/';
$autoload = __DIR__ . '/../vendor/autoload.php';

if (is_file($manualBase . 'Exception.php')) {
    require_once $manualBase . 'Exception.php';
    require_once $manualBase . 'PHPMailer.php';
    require_once $manualBase . 'SMTP.php';
} elseif (is_file($autoload)) {
    require_once $autoload;
}

function mailConfig(string $key, string $default = ''): string {
    return trim((string)(getenv($key) ?: $default));
}

function createMailer(string $fromAddress, string $fromName): PHPMailer {
    if (!class_exists(PHPMailer::class)) {
        throw new RuntimeException('PHPMailer is not installed. Upload PHPMailer to api/lib/PHPMailer/src/.');
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = mailConfig('MAIL_HOST', '127.0.0.1');
    $mail->Port = (int)mailConfig('MAIL_PORT', '25');

    $username = mailConfig('MAIL_USERNAME');
    $password = mailConfig('MAIL_PASSWORD');
    $mail->SMTPAuth = $username !== '';
    if ($mail->SMTPAuth) {
        $mail->Username = $username;
        $mail->Password = $password;
    }

    $encryption = strtolower(mailConfig('MAIL_ENCRYPTION'));
    if ($encryption === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($encryption === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure = '';
        $mail->SMTPAutoTLS = false;
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($fromAddress, $fromName);
    return $mail;
}

function sendHtmlMail(string $fromAddress, string $fromName, string $toAddress, string $toName, string $subject, string $html): bool {
    try {
        $mail = createMailer($fromAddress, $fromName);
        $mail->addAddress($toAddress, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $plain = preg_replace('/<br\s*\/?\s*>/i', "\n", $html) ?? $html;
        $mail->AltBody = trim(preg_replace('/<[^>]+>/', ' ', html_entity_decode($plain, ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
        $mail->send();
        return true;
    } catch (Throwable $e) {
        error_log('Mailer error: ' . $e->getMessage());
        return false;
    }
}

function sendHtmlMailToMany(string $fromAddress, string $fromName, array $recipients, string $subject, string $html): int {
    $sent = 0;
    foreach ($recipients as $recipient) {
        $email = trim((string)($recipient['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) continue;
        $name = trim((string)($recipient['name'] ?? ''));
        if (sendHtmlMail($fromAddress, $fromName, $email, $name, $subject, $html)) $sent++;
    }
    return $sent;
}
