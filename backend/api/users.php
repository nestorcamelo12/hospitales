<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/users - Listar usuarios con paginación
function handleGetUsers(): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    // Parámetros de paginación y filtros
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
    $search = $_GET['search'] ?? '';
    $roleId = isset($_GET['role_id']) ? (int)$_GET['role_id'] : null;
    $hospitalId = isset($_GET['hospital_id']) ? (int)$_GET['hospital_id'] : null;
    $isActive = isset($_GET['is_active']) ? (int)$_GET['is_active'] : null;

    // Construir query de conteo
    $whereConditions = [];
    $params = [];

    if ($search) {
        $whereConditions[] = "(u.name LIKE :search OR u.email LIKE :search)";
        $params[':search'] = "%{$search}%";
    }

    if ($roleId) {
        $whereConditions[] = "u.role_id = :role_id";
        $params[':role_id'] = $roleId;
    }

    if ($hospitalId) {
        $whereConditions[] = "u.hospital_id = :hospital_id";
        $params[':hospital_id'] = $hospitalId;
    }

    if ($isActive !== null) {
        $whereConditions[] = "u.is_active = :is_active";
        $params[':is_active'] = $isActive;
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Contar total
    $countSql = "SELECT COUNT(*) as total FROM users u {$whereClause}";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetch()['total'];

    // Obtener usuarios
    $offset = ($page - 1) * $perPage;
    $sql = "
        SELECT u.id, u.name, u.email, u.role_id, u.hospital_id, u.is_active,
               u.created_at, u.updated_at,
               r.name as role_name,
               h.name as hospital_name,
               creator.name as created_by_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN hospitals h ON u.hospital_id = h.id
        LEFT JOIN users creator ON u.created_by = creator.id
        {$whereClause}
        ORDER BY u.created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll();

    // Formatear datos
    $data = array_map(function($u) {
        return [
            'id' => (int)$u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role_id' => (int)$u['role_id'],
            'role_name' => $u['role_name'],
            'hospital_id' => $u['hospital_id'] ? (int)$u['hospital_id'] : null,
            'hospital_name' => $u['hospital_name'],
            'is_active' => (bool)$u['is_active'],
            'created_at' => $u['created_at'],
            'updated_at' => $u['updated_at'],
            'created_by_name' => $u['created_by_name']
        ];
    }, $users);

    Helpers::jsonResponse([
        'data' => $data,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage)
        ]
    ]);
}

// GET /api/users/{id} - Obtener usuario
function handleGetUser(int $id): void
{
    $currentUser = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    $stmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.role_id, u.hospital_id, u.is_active,
               u.created_at, u.updated_at,
               r.name as role_name, r.description as role_description,
               h.name as hospital_name, h.address as hospital_address,
               creator.name as created_by_name,
               updater.name as updated_by_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN hospitals h ON u.hospital_id = h.id
        LEFT JOIN users creator ON u.created_by = creator.id
        LEFT JOIN users updater ON u.updated_by = updater.id
        WHERE u.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();

    if (!$user) {
        Helpers::errorResponse('Usuario no encontrado', 404);
    }

    Helpers::jsonResponse([
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role_id' => (int)$user['role_id'],
        'role_name' => $user['role_name'],
        'role_description' => $user['role_description'],
        'hospital_id' => $user['hospital_id'] ? (int)$user['hospital_id'] : null,
        'hospital_name' => $user['hospital_name'],
        'hospital_address' => $user['hospital_address'],
        'is_active' => (bool)$user['is_active'],
        'created_at' => $user['created_at'],
        'updated_at' => $user['updated_at'],
        'created_by_name' => $user['created_by_name'],
        'updated_by_name' => $user['updated_by_name']
    ]);
}

// POST /api/users - Crear usuario
function handleCreateUser(): void
{
    $currentUser = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Validar campos requeridos
    $error = Helpers::validateRequired($input, ['name', 'email', 'password', 'role_id']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $password = $input['password'];
    $roleId = (int)$input['role_id'];
    $hospitalId = isset($input['hospital_id']) && $input['hospital_id'] ? (int)$input['hospital_id'] : null;
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;

    // Validar email
    if (!Helpers::validateEmail($email)) {
        Helpers::errorResponse('Formato de email inválido', 400);
    }

    // Validar longitud de contraseña
    if (strlen($password) < 6) {
        Helpers::errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
    }

    // Verificar si el email ya existe
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        Helpers::errorResponse('El email ya está registrado', 409);
    }

    // Verificar que el rol existe
    $stmt = $db->prepare("SELECT id FROM roles WHERE id = :id");
    $stmt->execute([':id' => $roleId]);
    if (!$stmt->fetch()) {
        Helpers::errorResponse('Rol inválido', 400);
    }

    // Verificar hospital si se proporciona
    if ($hospitalId) {
        $stmt = $db->prepare("SELECT id FROM hospitals WHERE id = :id");
        $stmt->execute([':id' => $hospitalId]);
        if (!$stmt->fetch()) {
            Helpers::errorResponse('Hospital inválido', 400);
        }
    }

    // Hash de contraseña
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    // Crear usuario
    $stmt = $db->prepare("
        INSERT INTO users (name, email, password, role_id, hospital_id, is_active, created_by)
        VALUES (:name, :email, :password, :role_id, :hospital_id, :is_active, :created_by)
    ");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password' => $hashedPassword,
        ':role_id' => $roleId,
        ':hospital_id' => $hospitalId,
        ':is_active' => $isActive,
        ':created_by' => (int)$currentUser->sub
    ]);

    $userId = (int)$db->lastInsertId();

    // Auditoría
    Helpers::logAudit($db, (int)$currentUser->sub, 'create', 'user', $userId, [
        'name' => $name,
        'email' => $email,
        'role_id' => $roleId
    ]);

    // Obtener usuario creado
    $stmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.role_id, u.hospital_id, u.is_active, u.created_at,
               r.name as role_name, h.name as hospital_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN hospitals h ON u.hospital_id = h.id
        WHERE u.id = :id
    ");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    Helpers::jsonResponse([
        'message' => 'Usuario creado exitosamente',
        'data' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role_id' => (int)$user['role_id'],
            'role_name' => $user['role_name'],
            'hospital_id' => $user['hospital_id'] ? (int)$user['hospital_id'] : null,
            'hospital_name' => $user['hospital_name'],
            'is_active' => (bool)$user['is_active'],
            'created_at' => $user['created_at']
        ]
    ], 201);
}

// PUT /api/users/{id} - Actualizar usuario
function handleUpdateUser(int $id): void
{
    $currentUser = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Verificar que el usuario existe
    $stmt = $db->prepare("SELECT id, email FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $existingUser = $stmt->fetch();

    if (!$existingUser) {
        Helpers::errorResponse('Usuario no encontrado', 404);
    }

    // Validar campos requeridos
    $error = Helpers::validateRequired($input, ['name', 'email', 'role_id']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $roleId = (int)$input['role_id'];
    $hospitalId = isset($input['hospital_id']) && $input['hospital_id'] ? (int)$input['hospital_id'] : null;
    $isActive = isset($input['is_active']) ? (int)$input['is_active'] : 1;

    // Validar email
    if (!Helpers::validateEmail($email)) {
        Helpers::errorResponse('Formato de email inválido', 400);
    }

    // Verificar email duplicado
    if ($email !== $existingUser['email']) {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $stmt->execute([':email' => $email, ':id' => $id]);
        if ($stmt->fetch()) {
            Helpers::errorResponse('El email ya está registrado', 409);
        }
    }

    // Verificar rol
    $stmt = $db->prepare("SELECT id FROM roles WHERE id = :id");
    $stmt->execute([':id' => $roleId]);
    if (!$stmt->fetch()) {
        Helpers::errorResponse('Rol inválido', 400);
    }

    // Verificar hospital
    if ($hospitalId) {
        $stmt = $db->prepare("SELECT id FROM hospitals WHERE id = :id");
        $stmt->execute([':id' => $hospitalId]);
        if (!$stmt->fetch()) {
            Helpers::errorResponse('Hospital inválido', 400);
        }
    }

    // Actualizar usuario
    $updateSql = "
        UPDATE users 
        SET name = :name, email = :email, role_id = :role_id, 
            hospital_id = :hospital_id, is_active = :is_active, 
            updated_by = :updated_by
        WHERE id = :id
    ";

    $params = [
        ':name' => $name,
        ':email' => $email,
        ':role_id' => $roleId,
        ':hospital_id' => $hospitalId,
        ':is_active' => $isActive,
        ':updated_by' => (int)$currentUser->sub,
        ':id' => $id
    ];

    // Si se proporciona nueva contraseña
    if (isset($input['password']) && trim($input['password']) !== '') {
        $password = $input['password'];
        if (strlen($password) < 6) {
            Helpers::errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
        }
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $updateSql = "
            UPDATE users 
            SET name = :name, email = :email, password = :password, 
                role_id = :role_id, hospital_id = :hospital_id, 
                is_active = :is_active, updated_by = :updated_by
            WHERE id = :id
        ";
        $params[':password'] = $hashedPassword;
    }

    $stmt = $db->prepare($updateSql);
    $stmt->execute($params);

    // Auditoría
    Helpers::logAudit($db, (int)$currentUser->sub, 'update', 'user', $id, [
        'name' => $name,
        'email' => $email,
        'role_id' => $roleId,
        'password_changed' => isset($input['password']) && trim($input['password']) !== ''
    ]);

    // Obtener usuario actualizado
    $stmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.role_id, u.hospital_id, u.is_active, 
               u.created_at, u.updated_at,
               r.name as role_name, h.name as hospital_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN hospitals h ON u.hospital_id = h.id
        WHERE u.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();

    Helpers::jsonResponse([
        'message' => 'Usuario actualizado exitosamente',
        'data' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role_id' => (int)$user['role_id'],
            'role_name' => $user['role_name'],
            'hospital_id' => $user['hospital_id'] ? (int)$user['hospital_id'] : null,
            'hospital_name' => $user['hospital_name'],
            'is_active' => (bool)$user['is_active'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at']
        ]
    ]);
}

// DELETE /api/users/{id} - Desactivar usuario (soft delete)
function handleDeleteUser(int $id): void
{
    $currentUser = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    // Verificar que el usuario existe
    $stmt = $db->prepare("SELECT name, email FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();

    if (!$user) {
        Helpers::errorResponse('Usuario no encontrado', 404);
    }

    // No permitir desactivar el propio usuario
    if ($id === (int)$currentUser->sub) {
        Helpers::errorResponse('No puedes desactivar tu propio usuario', 403);
    }

    // Desactivar usuario (soft delete)
    $stmt = $db->prepare("UPDATE users SET is_active = 0, updated_by = :updated_by WHERE id = :id");
    $stmt->execute([
        ':updated_by' => (int)$currentUser->sub,
        ':id' => $id
    ]);

    // Auditoría
    Helpers::logAudit($db, (int)$currentUser->sub, 'deactivate', 'user', $id, [
        'name' => $user['name'],
        'email' => $user['email']
    ]);

    Helpers::jsonResponse(['message' => 'Usuario desactivado exitosamente']);
}


