<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$autoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

function mailConfig(string $key, string $default = ''): string {
    return trim((string)(getenv($key) ?: $default));
}

function createMailer(string $fromAddress, string $fromName): PHPMailer {
    if (!class_exists(PHPMailer::class)) {
        throw new RuntimeException('PHPMailer is not installed. Run composer install in the API directory.');
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = mailConfig('MAIL_HOST', '127.0.0.1');
    $mail->Port = (int)mailConfig('MAIL_PORT', '25');
    $mail->SMTPAuth = mailConfig('MAIL_USERNAME') !== '';
    if ($mail->SMTPAuth) {
        $mail->Username = mailConfig('MAIL_USERNAME');
        $mail->Password = mailConfig('MAIL_PASSWORD');
    }
    $encryption = strtolower(mailConfig('MAIL_ENCRYPTION'));
    if ($encryption === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($encryption === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
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
        $mail->AltBody = trim(preg_replace('/<[^>]+>/', ' ', html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
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
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            continue;
        }
        $name = trim((string)($recipient['name'] ?? ''));
        if (sendHtmlMail($fromAddress, $fromName, $email, $name, $subject, $html)) {
            $sent++;
        }
    }
    return $sent;
}
