<?php
declare(strict_types=1);

function mailLayout(string $eyebrow, string $title, string $body, string $footer = ''): string {
    return '<!doctype html><html><body style="margin:0;padding:0;background:#f4ebe1;color:#2c1810;font-family:Arial,sans-serif;">'
        . '<div style="padding:36px 16px;"><div style="max-width:620px;margin:0 auto;background:#fdfbf7;border:1px solid #d4af37;box-shadow:0 12px 30px rgba(44,24,16,.08);">'
        . '<div style="padding:28px 32px;border-bottom:1px solid #d4af37;text-align:center;">'
        . '<div style="display:inline-block;width:42px;height:42px;line-height:42px;border-radius:50%;background:#5b1217;color:#f3e5ab;border:1px solid #d4af37;font-family:Georgia,serif;font-size:25px;">A</div>'
        . '<div style="margin-top:9px;color:#5b1217;font-family:Georgia,serif;font-size:25px;">ARAmane Arts</div>'
        . '<div style="margin-top:4px;color:#8a7770;font-size:9px;letter-spacing:2px;">ATELIER</div></div>'
        . '<div style="padding:34px 32px;"><div style="color:#8a7770;font-size:10px;letter-spacing:2px;">'.htmlspecialchars($eyebrow,ENT_QUOTES,'UTF-8').'</div>'
        . '<h1 style="margin:8px 0 20px;color:#5b1217;font-family:Georgia,serif;font-size:30px;font-weight:600;">'.htmlspecialchars($title,ENT_QUOTES,'UTF-8').'</h1>'
        . $body . '</div>'
        . '<div style="padding:18px 32px;border-top:1px solid #eadfd2;color:#8a7770;font-size:10px;line-height:1.6;text-align:center;">'.($footer !== '' ? $footer : 'ARAmane Arts · Heritage Art & Craft').'</div>'
        . '</div></div></body></html>';
}

function orderCreatedCustomerEmail(string $orderNumber, float $totalAmount, string $customerName): array {
    $body='<p style="font-size:14px;line-height:1.7;">Dear '.htmlspecialchars($customerName,ENT_QUOTES,'UTF-8').',</p><p style="font-size:14px;line-height:1.7;">Thank you for placing your order request with ARAmane Arts. Your request has been received and will be reviewed by the artist.</p><div style="margin:24px 0;padding:18px;background:#f4ebe1;border-left:3px solid #d4af37;"><div style="color:#8a7770;font-size:10px;letter-spacing:1px;">ORDER</div><div style="margin-top:6px;color:#5b1217;font-family:Georgia,serif;font-size:22px;">'.htmlspecialchars($orderNumber,ENT_QUOTES,'UTF-8').'</div><div style="margin-top:10px;color:#2c1810;font-size:13px;">Requested amount: <strong>₹'.number_format($totalAmount,2,'.',',').'</strong></div></div><p style="font-size:13px;line-height:1.7;color:#6e5b53;">The artist will get in touch if any clarification is required. Payment options and expected delivery details will be provided after your order is accepted.</p>';
    return ['subject'=>'Order request received · '.$orderNumber,'html'=>mailLayout('ORDER REQUEST','Thank you for your order',$body)];
}
function orderStatusCustomerEmail(string $orderNumber, string $status, string $customerName, string $notes = ''): array {
    $label=ucwords(strtolower(str_replace('_',' ',$status))); $body='<p style="font-size:14px;line-height:1.7;">Dear '.htmlspecialchars($customerName,ENT_QUOTES,'UTF-8').',</p><p style="font-size:14px;line-height:1.7;">There is an update to your ARAmane Arts order.</p><div style="margin:24px 0;padding:18px;background:#f4ebe1;border-left:3px solid #d4af37;"><div style="color:#8a7770;font-size:10px;letter-spacing:1px;">ORDER STATUS</div><div style="margin-top:6px;color:#5b1217;font-family:Georgia,serif;font-size:22px;">'.htmlspecialchars($label,ENT_QUOTES,'UTF-8').'</div><div style="margin-top:8px;color:#6e5b53;font-size:12px;">'.htmlspecialchars($orderNumber,ENT_QUOTES,'UTF-8').'</div></div>';
    if($notes!=='')$body.='<p style="font-size:13px;line-height:1.7;"><strong>Artist note:</strong><br>'.nl2br(htmlspecialchars($notes,ENT_QUOTES,'UTF-8')).'</p>';
    $body.='<p style="font-size:13px;line-height:1.7;color:#6e5b53;">You can sign in to your ARAmane Arts account to view the order journey and latest details.</p>';
    return ['subject'=>'Order update · '.$orderNumber,'html'=>mailLayout('ORDER UPDATE',$label,$body)];
}
function orderCreatedAdminEmail(array $order): array {
    $number=(string)$order['order_number'];$name=(string)$order['shipping_name'];$email=(string)$order['customer_email'];$phone=(string)$order['shipping_phone'];$total=(float)$order['total_amount'];
    $body='<p style="font-size:14px;line-height:1.7;">A new order request has been received and is awaiting artist review.</p><div style="margin:24px 0;padding:18px;background:#f4ebe1;border-left:3px solid #d4af37;"><div style="color:#8a7770;font-size:10px;letter-spacing:1px;">ORDER</div><div style="margin-top:6px;color:#5b1217;font-family:Georgia,serif;font-size:22px;">'.htmlspecialchars($number,ENT_QUOTES,'UTF-8').'</div><div style="margin-top:10px;font-size:13px;line-height:1.7;"><strong>'.htmlspecialchars($name,ENT_QUOTES,'UTF-8').'</strong><br>'.htmlspecialchars($email,ENT_QUOTES,'UTF-8').'<br>'.htmlspecialchars($phone,ENT_QUOTES,'UTF-8').'<br>₹'.number_format($total,2,'.',',').'</div></div>';
    return ['subject'=>'New order request · '.$number,'html'=>mailLayout('SYSTEM · NEW ORDER','New order received',$body)];
}
function adminOtpEmail(string $otp, string $adminEmail): array {
    $body='<p style="font-size:14px;line-height:1.7;">A sign-in verification code was requested for your ARAmane Arts administrator account.</p><div style="margin:26px 0;text-align:center;padding:22px;background:#f4ebe1;border:1px solid #d4af37;"><div style="color:#8a7770;font-size:10px;letter-spacing:1.5px;">VERIFICATION CODE</div><div style="margin-top:10px;color:#5b1217;font-family:Georgia,serif;font-size:36px;letter-spacing:8px;">'.htmlspecialchars($otp,ENT_QUOTES,'UTF-8').'</div><div style="margin-top:9px;color:#6e5b53;font-size:11px;">Valid for 10 minutes</div></div><p style="font-size:12px;line-height:1.7;color:#6e5b53;">If you did not request this code, secure your administrator account and review your access settings.</p>';
    return ['subject'=>'ARAmane Arts administrator verification code','html'=>mailLayout('SYSTEM · SECURITY','Your verification code',$body,'ARAmane Arts · This message was sent to '.htmlspecialchars($adminEmail,ENT_QUOTES,'UTF-8'))];
}
function passwordResetEmail(string $name, string $url, string $accountType): array {
    $kind=$accountType==='admin'?'administrator':'customer';
    $body='<p style="font-size:14px;line-height:1.7;">Dear '.htmlspecialchars($name,ENT_QUOTES,'UTF-8').',</p><p style="font-size:14px;line-height:1.7;">We received a request to reset the password for your ARAmane Arts '.$kind.' account.</p><div style="margin:28px 0;text-align:center;"><a href="'.htmlspecialchars($url,ENT_QUOTES,'UTF-8').'" style="display:inline-block;background:#5b1217;color:#fdfbf7;text-decoration:none;padding:13px 22px;border:1px solid #d4af37;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Reset your password</a></div><p style="font-size:12px;line-height:1.7;color:#6e5b53;">This link expires in 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email.</p>';
    return ['subject'=>'Reset your ARAmane Arts password','html'=>mailLayout('SYSTEM · SECURITY','Reset your password',$body)];
}
