<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/hospitals - Listar hospitales
function handleGetHospitals(): void
{
    AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $search = $_GET['search'] ?? '';
    $sql = "SELECT id, name, address, phone, created_at, updated_at FROM hospitals";
    
    if ($search) {
        $sql .= " WHERE name LIKE :search OR address LIKE :search";
    }
    
    $sql .= " ORDER BY name";

    $stmt = $db->prepare($sql);
    
    if ($search) {
        $stmt->execute([':search' => "%{$search}%"]);
    } else {
        $stmt->execute();
    }

    $hospitals = $stmt->fetchAll();

    $data = array_map(function($h) {
        return [
            'id' => (int)$h['id'],
            'name' => $h['name'],
            'address' => $h['address'],
            'phone' => $h['phone'],
            'created_at' => $h['created_at'],
            'updated_at' => $h['updated_at']
        ];
    }, $hospitals);

    Helpers::jsonResponse($data);
}

// GET /api/hospitals/{id} - Obtener hospital
function handleGetHospital(int $id): void
{
    AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("SELECT id, name, address, phone, created_at, updated_at FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $hospital = $stmt->fetch();

    if (!$hospital) {
        Helpers::errorResponse('Hospital no encontrado', 404);
    }

    Helpers::jsonResponse([
        'id' => (int)$hospital['id'],
        'name' => $hospital['name'],
        'address' => $hospital['address'],
        'phone' => $hospital['phone'],
        'created_at' => $hospital['created_at'],
        'updated_at' => $hospital['updated_at']
    ]);
}

// POST /api/hospitals - Crear hospital
function handleCreateHospital(): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Validar campos
    $error = Helpers::validateRequired($input, ['name']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $name = trim($input['name']);
    $address = trim($input['address'] ?? '');
    $phone = trim($input['phone'] ?? '');

    // Verificar si ya existe
    $stmt = $db->prepare("SELECT id FROM hospitals WHERE name = :name");
    $stmt->execute([':name' => $name]);
    if ($stmt->fetch()) {
        Helpers::errorResponse('Ya existe un hospital con este nombre', 409);
    }

    // Crear hospital
    $stmt = $db->prepare("
        INSERT INTO hospitals (name, address, phone) 
        VALUES (:name, :address, :phone)
    ");
    $stmt->execute([
        ':name' => $name,
        ':address' => $address,
        ':phone' => $phone
    ]);

    $hospitalId = (int)$db->lastInsertId();

    // Auditoría
    Helpers::logAudit($db, (int)$user->sub, 'create', 'hospital', $hospitalId, [
        'name' => $name
    ]);

    // Obtener hospital creado
    $stmt = $db->prepare("SELECT id, name, address, phone, created_at FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $hospitalId]);
    $hospital = $stmt->fetch();

    Helpers::jsonResponse([
        'message' => 'Hospital creado exitosamente',
        'data' => [
            'id' => (int)$hospital['id'],
            'name' => $hospital['name'],
            'address' => $hospital['address'],
            'phone' => $hospital['phone'],
            'created_at' => $hospital['created_at']
        ]
    ], 201);
}

// PUT /api/hospitals/{id} - Actualizar hospital
function handleUpdateHospital(int $id): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Verificar si existe
    $stmt = $db->prepare("SELECT id FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        Helpers::errorResponse('Hospital no encontrado', 404);
    }

    // Validar campos
    $error = Helpers::validateRequired($input, ['name']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $name = trim($input['name']);
    $address = trim($input['address'] ?? '');
    $phone = trim($input['phone'] ?? '');

    // Verificar nombre duplicado
    $stmt = $db->prepare("SELECT id FROM hospitals WHERE name = :name AND id != :id");
    $stmt->execute([':name' => $name, ':id' => $id]);
    if ($stmt->fetch()) {
        Helpers::errorResponse('Ya existe otro hospital con este nombre', 409);
    }

    // Actualizar
    $stmt = $db->prepare("
        UPDATE hospitals 
        SET name = :name, address = :address, phone = :phone 
        WHERE id = :id
    ");
    $stmt->execute([
        ':name' => $name,
        ':address' => $address,
        ':phone' => $phone,
        ':id' => $id
    ]);

    // Auditoría
    Helpers::logAudit($db, (int)$user->sub, 'update', 'hospital', $id, [
        'name' => $name
    ]);

    // Obtener hospital actualizado
    $stmt = $db->prepare("SELECT id, name, address, phone, created_at, updated_at FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $hospital = $stmt->fetch();

    Helpers::jsonResponse([
        'message' => 'Hospital actualizado exitosamente',
        'data' => [
            'id' => (int)$hospital['id'],
            'name' => $hospital['name'],
            'address' => $hospital['address'],
            'phone' => $hospital['phone'],
            'created_at' => $hospital['created_at'],
            'updated_at' => $hospital['updated_at']
        ]
    ]);
}

// DELETE /api/hospitals/{id} - Eliminar hospital
function handleDeleteHospital(int $id): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    // Verificar si existe
    $stmt = $db->prepare("SELECT name FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $hospital = $stmt->fetch();
    
    if (!$hospital) {
        Helpers::errorResponse('Hospital no encontrado', 404);
    }

    // Verificar si tiene usuarios asociados
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE hospital_id = :id");
    $stmt->execute([':id' => $id]);
    $count = $stmt->fetch()['count'];

    if ($count > 0) {
        Helpers::errorResponse("No se puede eliminar el hospital porque tiene {$count} usuarios asociados", 409);
    }

    // Eliminar
    $stmt = $db->prepare("DELETE FROM hospitals WHERE id = :id");
    $stmt->execute([':id' => $id]);

    // Auditoría
    Helpers::logAudit($db, (int)$user->sub, 'delete', 'hospital', $id, [
        'name' => $hospital['name']
    ]);

    Helpers::jsonResponse(['message' => 'Hospital eliminado exitosamente']);
}


