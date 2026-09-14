<?php
require_once __DIR__ . '/_common.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/google.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$data = requestJson();
$type = $data['type'] ?? 'email';

if ($type === 'google') {
    $token = trim((string)($data['token'] ?? ''));
    if ($token === '' || $googleClientId === '') {
        jsonResponse(['success' => false, 'message' => 'Google sign-in is not configured.'], 503);
    }

    $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
    $ch = curl_init($verifyUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT => 8,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        jsonResponse(['success' => false, 'message' => 'Invalid Google credential.'], 401);
    }

    $googleUser = json_decode($response, true);
    $issuer = $googleUser['iss'] ?? '';
    $audience = $googleUser['aud'] ?? '';
    $expiresAt = (int)($googleUser['exp'] ?? 0);
    $googleSub = trim((string)($googleUser['sub'] ?? ''));
    $emailVerified = ($googleUser['email_verified'] ?? false) === true || ($googleUser['email_verified'] ?? '') === 'true';

    if (!is_array($googleUser)
        || !isset($googleUser['email'])
        || $googleSub === ''
        || !in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)
        || !hash_equals($googleClientId, (string)$audience)
        || $expiresAt <= time()
        || !$emailVerified
    ) {
        jsonResponse(['success' => false, 'message' => 'Invalid Google credential.'], 401);
    }

    $email = strtolower(trim((string)$googleUser['email']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Invalid Google account email.'], 401);
    }

    $firstName = trim((string)($googleUser['given_name'] ?? 'User'));
    $lastName = trim((string)($googleUser['family_name'] ?? ''));

    try {
        $stmt = $pdo->prepare('SELECT u.id,u.email,u.password_hash,u.phone,u.first_name,u.last_name,u.is_active FROM users u INNER JOIN user_google_accounts g ON g.user_id=u.id WHERE g.google_sub=? LIMIT 1');
        $stmt->execute([$googleSub]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $stmt = $pdo->prepare('SELECT id,email,password_hash,phone,first_name,last_name,is_active FROM users WHERE email=? LIMIT 1');
            $stmt->execute([$email]);
            $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingUser) {
                jsonResponse([
                    'success' => false,
                    'message' => 'An account with this email already exists. Sign in with your password first, then link Google from your account settings.'
                ], 409);
            }

            $pdo->beginTransaction();
            try {
                $insert = $pdo->prepare('INSERT INTO users (email,password_hash,first_name,last_name) VALUES (?,?,?,?)');
                $insert->execute([$email, '', $firstName, $lastName]);
                $userId = (int)$pdo->lastInsertId();

                $link = $pdo->prepare('INSERT INTO user_google_accounts (user_id,google_sub) VALUES (?,?)');
                $link->execute([$userId, $googleSub]);
                $pdo->commit();

                $user = [
                    'id' => $userId,
                    'email' => $email,
                    'phone' => null,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'is_active' => 1,
                ];
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $e;
            }
        }

        if (empty($user['is_active'])) {
            jsonResponse(['success' => false, 'message' => 'User account is unavailable'], 403);
        }

        session_regenerate_id(true);
        unset($_SESSION['admin_user_id'],$_SESSION['admin_user_type'],$_SESSION['admin_email'],$_SESSION['admin_authenticated_at'],$_SESSION['admin_2fa_verified'],$_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_type'] = 'customer';
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_authenticated_at'] = time();

        jsonResponse(['success'=>true,'user'=>['id'=>(int)$user['id'],'email'=>$user['email'],'first_name'=>$user['first_name'],'last_name'=>$user['last_name']]]);
    } catch (PDOException $e) {
        error_log('Google login database error: ' . $e->getMessage());
        jsonResponse(['success'=>false,'message'=>'Google sign-in is temporarily unavailable.'],500);
    } catch (Throwable $e) {
        error_log('Google login error: ' . $e->getMessage());
        jsonResponse(['success'=>false,'message'=>'Unable to sign in with Google right now.'],500);
    }
}

$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    jsonResponse(['success'=>false,'message'=>'Email and password are required.'],422);
}

try {
    $stmt=$pdo->prepare('SELECT id,email,password_hash,phone,first_name,last_name,is_active FROM users WHERE email=? LIMIT 1');
    $stmt->execute([$email]);
    $user=$stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['password_hash']) || !password_verify($password,$user['password_hash'])) {
        usleep(250000);
        jsonResponse(['success'=>false,'message'=>'Invalid email or password.'],401);
    }

    if (empty($user['is_active'])) {
        jsonResponse(['success'=>false,'message'=>'User account is unavailable.'],403);
    }

    session_regenerate_id(true);
    unset($_SESSION['admin_user_id'],$_SESSION['admin_user_type'],$_SESSION['admin_email'],$_SESSION['admin_authenticated_at'],$_SESSION['admin_2fa_verified'],$_SESSION['admin_pending_user_id'],$_SESSION['admin_pending_email'],$_SESSION['admin_otp_required']);
    $_SESSION['user_id']=(int)$user['id'];
    $_SESSION['user_type']='customer';
    $_SESSION['user_email']=$user['email'];
    $_SESSION['user_authenticated_at']=time();

    jsonResponse(['success'=>true,'user'=>['id'=>(int)$user['id'],'email'=>$user['email'],'first_name'=>$user['first_name'],'last_name'=>$user['last_name']]]);
} catch (Throwable $e) {
    error_log('User login: '.$e->getMessage());
    jsonResponse(['success'=>false,'message'=>'Unable to sign in right now.'],500);
}
