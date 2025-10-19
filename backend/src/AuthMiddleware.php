<?php

namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware
{
    /**
     * Verifica el token JWT y retorna el payload decodificado
     */
    public static function authenticate(): ?object
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(['error' => 'Token no proporcionado']);
            exit;
        }

        $token = $matches[1];
        $secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret';

        try {
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
            return $decoded;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido o expirado']);
            exit;
        }
    }

    /**
     * Verifica que el usuario tenga rol de administrador
     */
    public static function requireAdmin(): object
    {
        $user = self::authenticate();
        
        if (!isset($user->role) || (int)$user->role !== 1) {
            http_response_code(403);
            echo json_encode(['error' => 'Acceso denegado. Se requiere rol de administrador']);
            exit;
        }

        return $user;
    }

    /**
     * Obtiene el usuario actual autenticado (opcional)
     */
    public static function optional(): ?object
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }

        $token = $matches[1];
        $secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret';

        try {
            return JWT::decode($token, new Key($secretKey, 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }
}


