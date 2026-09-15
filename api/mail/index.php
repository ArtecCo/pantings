<?php
declare(strict_types=1);
require_once __DIR__ . '/Mailer.php';
require_once __DIR__ . '/Templates.php';

const ORDERS_FROM_EMAIL = 'orders@arts.araha.co.in';
const ORDERS_FROM_NAME = 'Orders - Araha Arts';
const SYSTEMS_FROM_EMAIL = 'systems@arts.araha.co.in';
const SYSTEMS_FROM_NAME = 'Systems - Araha Arts
';

function mailGroupRecipients(PDO $pdo, string $groupKey): array {
    $stmt=$pdo->prepare('SELECT r.recipient_name AS name,r.recipient_email AS email FROM mail_groups g INNER JOIN mail_group_recipients r ON r.mail_group_id=g.id WHERE g.group_key=? AND g.is_active=1 AND r.is_active=1 ORDER BY r.id ASC');
    $stmt->execute([$groupKey]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function sendNewOrderNotifications(PDO $pdo, array $order): void {
    $customerEmail=trim((string)($order['customer_email']??''));
    $customerName=trim((string)($order['shipping_name']??'Customer'));
    if(filter_var($customerEmail,FILTER_VALIDATE_EMAIL)) {
        $mail=orderCreatedCustomerEmail((string)$order['order_number'],(float)$order['total_amount'],$customerName);
        sendHtmlMail(ORDERS_FROM_EMAIL,ORDERS_FROM_NAME,$customerEmail,$customerName,$mail['subject'],$mail['html']);
    }
    $recipients=mailGroupRecipients($pdo,'ORDER_UPDATES');
    if($recipients) {
        $mail=orderCreatedAdminEmail($order);
        sendHtmlMailToMany(SYSTEMS_FROM_EMAIL,SYSTEMS_FROM_NAME,$recipients,$mail['subject'],$mail['html']);
    }
}

function sendOrderStatusNotification(PDO $pdo, array $order, string $status, string $notes=''): void {
    $email=trim((string)($order['customer_email']??''));
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) return;
    $mail=orderStatusCustomerEmail((string)$order['order_number'],$status,trim((string)($order['shipping_name']??'Customer')),$notes);
    sendHtmlMail(ORDERS_FROM_EMAIL,ORDERS_FROM_NAME,$email,trim((string)($order['shipping_name']??'')),$mail['subject'],$mail['html']);
}

function sendAdminOtp(string $email,string $otp): bool {
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) return false;
    $mail=adminOtpEmail($otp,$email);
    return sendHtmlMail(SYSTEMS_FROM_EMAIL,SYSTEMS_FROM_NAME,$email,'Administrator',$mail['subject'],$mail['html']);
}
