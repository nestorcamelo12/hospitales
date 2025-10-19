<?php

namespace App;

use PDO;

class Helpers
{
    /**
     * Envía una respuesta JSON
     */
    public static function jsonResponse($data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Envía una respuesta de error
     */
    public static function errorResponse(string $message, int $status = 400): void
    {
        self::jsonResponse(['error' => $message], $status);
    }

    /**
     * Obtiene el body JSON de la petición
     */
    public static function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return $data ?? [];
    }

    /**
     * Valida campos requeridos
     */
    public static function validateRequired(array $data, array $required): ?string
    {
        foreach ($required as $field) {
            // Verificar que el campo exista
            if (!isset($data[$field])) {
                return "El campo '{$field}' es requerido";
            }
            
            $value = $data[$field];
            
            // Si es un string, validar que no esté vacío después de trim
            if (is_string($value) && trim($value) === '') {
                return "El campo '{$field}' es requerido";
            }
            
            // Si es un array, validar que no esté vacío
            if (is_array($value) && empty($value)) {
                return "El campo '{$field}' es requerido";
            }
            
            // Si es null, también es inválido
            if ($value === null) {
                return "El campo '{$field}' es requerido";
            }
        }
        return null;
    }

    /**
     * Valida formato de email
     */
    public static function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Registra una acción en audit_logs
     */
    public static function logAudit(
        PDO $db,
        ?int $userId,
        string $action,
        string $entity,
        ?int $entityId,
        ?array $details = null
    ): void {
        try {
            $stmt = $db->prepare("
                INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
                VALUES (:user_id, :action, :entity, :entity_id, :details, :ip)
            ");
            
            $stmt->execute([
                ':user_id' => $userId,
                ':action' => $action,
                ':entity' => $entity,
                ':entity_id' => $entityId,
                ':details' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the flow
            error_log("Audit log error: " . $e->getMessage());
        }
    }

    /**
     * Obtiene información del rol por ID
     */
    public static function getRoleInfo(PDO $db, int $roleId): ?array
    {
        $stmt = $db->prepare("SELECT id, name, description FROM roles WHERE id = :id");
        $stmt->execute([':id' => $roleId]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Obtiene información del hospital por ID
     */
    public static function getHospitalInfo(PDO $db, ?int $hospitalId): ?array
    {
        if (!$hospitalId) return null;
        
        $stmt = $db->prepare("SELECT id, name, address, phone FROM hospitals WHERE id = :id");
        $stmt->execute([':id' => $hospitalId]);
        return $stmt->fetch() ?: null;
    }
}

