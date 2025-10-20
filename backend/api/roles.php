<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/roles - Obtener todos los roles
function handleGetRoles(): void
{
    AuthMiddleware::authenticate();
    $db = Db::getInstance();

    // Obtener todos los roles
    $stmt = $db->query("SELECT id, name, description, created_at FROM roles ORDER BY id");
    $roles = $stmt->fetchAll();

    // Formatear respuesta
    $data = array_map(function($role) {
        return [
            'id' => (int)$role['id'],
            'name' => $role['name'],
            'description' => $role['description'],
            'created_at' => $role['created_at']
        ];
    }, $roles);

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $data
    ]);
}


