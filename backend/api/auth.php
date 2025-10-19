<?php

use App\Db;
use App\Helpers;
use Firebase\JWT\JWT;

$db = Db::getInstance();
$input = Helpers::getJsonInput();

// Validar campos requeridos
$error = Helpers::validateRequired($input, ['email', 'password']);
if ($error) {
    Helpers::errorResponse($error, 400);
}

$email = trim($input['email']);
$password = $input['password'];

// Validar formato de email
if (!Helpers::validateEmail($email)) {
    Helpers::errorResponse('Formato de email inválido', 400);
}

// Buscar usuario
$stmt = $db->prepare("
    SELECT u.id, u.name, u.email, u.password, u.role_id, u.hospital_id, u.is_active,
           r.name as role_name, h.name as hospital_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN hospitals h ON u.hospital_id = h.id
    WHERE u.email = :email
");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// Verificar usuario y contraseña
if (!$user || !password_verify($password, $user['password'])) {
    Helpers::logAudit($db, null, 'login_failed', 'user', null, ['email' => $email]);
    Helpers::errorResponse('Credenciales inválidas', 401);
}

// Verificar si el usuario está activo
if (!$user['is_active']) {
    Helpers::errorResponse('Usuario inactivo. Contacta al administrador', 403);
}

// Crear JWT
$secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret';
$expiration = (int)($_ENV['JWT_EXPIRATION'] ?? 28800); // 8 horas por defecto

$payload = [
    'iss' => 'unipaz',
    'sub' => (int)$user['id'],
    'role' => (int)$user['role_id'],
    'hospital' => $user['hospital_id'] ? (int)$user['hospital_id'] : null,
    'iat' => time(),
    'exp' => time() + $expiration
];

$jwt = JWT::encode($payload, $secretKey, 'HS256');

// Registrar login exitoso
Helpers::logAudit($db, (int)$user['id'], 'login_success', 'user', (int)$user['id']);

// Responder
Helpers::jsonResponse([
    'token' => $jwt,
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role_id' => (int)$user['role_id'],
        'role_name' => $user['role_name'],
        'hospital_id' => $user['hospital_id'] ? (int)$user['hospital_id'] : null,
        'hospital_name' => $user['hospital_name']
    ]
], 200);


