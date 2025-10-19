<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/pacientes/{id}/historial - Obtener historial médico del paciente
function handleGetMedicalRecords(int $pacienteId): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    // Verificar que el paciente existe
    $stmt = $db->prepare("SELECT hospital_id FROM patients WHERE id = :id");
    $stmt->execute([':id' => $pacienteId]);
    $patient = $stmt->fetch();

    if (!$patient) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    // Verificar permisos
    if ((int)$user->role !== 1 && (int)$user->hospital !== (int)$patient['hospital_id']) {
        Helpers::errorResponse('No tienes permiso para ver este historial', 403);
    }

    // Parámetros de paginación
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(50, (int)($_GET['per_page'] ?? 10)));

    // Contar total
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM medical_records WHERE paciente_id = :id");
    $stmt->execute([':id' => $pacienteId]);
    $total = (int)$stmt->fetch()['total'];

    // Obtener registros
    $offset = ($page - 1) * $perPage;
    $stmt = $db->prepare("
        SELECT mr.*, u.name as medico_name, u.email as medico_email
        FROM medical_records mr
        LEFT JOIN users u ON mr.medico_id = u.id
        WHERE mr.paciente_id = :id
        ORDER BY mr.fecha DESC
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':id', $pacienteId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $records = $stmt->fetchAll();

    $data = array_map(function($r) {
        return [
            'id' => (int)$r['id'],
            'paciente_id' => (int)$r['paciente_id'],
            'fecha' => $r['fecha'],
            'medico_id' => (int)$r['medico_id'],
            'medico_name' => $r['medico_name'],
            'medico_email' => $r['medico_email'],
            'diagnostico' => $r['diagnostico'],
            'tratamiento' => $r['tratamiento'],
            'medicamentos' => $r['medicamentos'],
            'observaciones' => $r['observaciones'],
            'adjuntos' => json_decode($r['adjuntos'], true),
            'created_at' => $r['created_at']
        ];
    }, $records);

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $data,
        'meta' => [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage)
        ]
    ]);
}

// POST /api/pacientes/{id}/historial - Crear registro médico
function handleCreateMedicalRecord(int $pacienteId): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Solo médicos y admins pueden crear registros
    if ((int)$user->role !== 1 && (int)$user->role !== 2) {
        Helpers::errorResponse('Solo médicos pueden crear registros médicos', 403);
    }

    // Verificar que el paciente existe
    $stmt = $db->prepare("SELECT hospital_id FROM patients WHERE id = :id AND is_active = 1");
    $stmt->execute([':id' => $pacienteId]);
    $patient = $stmt->fetch();

    if (!$patient) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    // Validar campos
    $error = Helpers::validateRequired($input, ['diagnostico']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $fecha = $input['fecha'] ?? date('Y-m-d H:i:s');
    $medicoId = isset($input['medico_id']) ? (int)$input['medico_id'] : (int)$user->sub;
    $diagnostico = trim($input['diagnostico']);
    $tratamiento = trim($input['tratamiento'] ?? '');
    $medicamentos = trim($input['medicamentos'] ?? '');
    $observaciones = trim($input['observaciones'] ?? '');
    $adjuntos = $input['adjuntos'] ?? [];

    // Verificar que el usuario es médico o administrador
    $stmt = $db->prepare("SELECT id, role_id FROM users WHERE id = :id AND role_id IN (1, 2) AND is_active = 1");
    $stmt->execute([':id' => $medicoId]);
    if (!$stmt->fetch()) {
        Helpers::errorResponse('Solo médicos o administradores pueden crear registros médicos', 400);
    }

    // Crear registro
    $stmt = $db->prepare("
        INSERT INTO medical_records (paciente_id, fecha, medico_id, diagnostico, tratamiento, 
                                     medicamentos, observaciones, adjuntos)
        VALUES (:paciente, :fecha, :medico, :diagnostico, :tratamiento, :medicamentos, 
                :observaciones, :adjuntos)
    ");
    $stmt->execute([
        ':paciente' => $pacienteId,
        ':fecha' => $fecha,
        ':medico' => $medicoId,
        ':diagnostico' => $diagnostico,
        ':tratamiento' => $tratamiento,
        ':medicamentos' => $medicamentos,
        ':observaciones' => $observaciones,
        ':adjuntos' => json_encode($adjuntos, JSON_UNESCAPED_UNICODE)
    ]);

    $recordId = (int)$db->lastInsertId();

    // Auditoría
    Helpers::logAudit($db, (int)$user->sub, 'create', 'medical_record', $recordId, [
        'paciente_id' => $pacienteId,
        'diagnostico' => $diagnostico
    ]);

    // Obtener registro creado
    $stmt = $db->prepare("
        SELECT mr.*, u.name as medico_name
        FROM medical_records mr
        LEFT JOIN users u ON mr.medico_id = u.id
        WHERE mr.id = :id
    ");
    $stmt->execute([':id' => $recordId]);
    $record = $stmt->fetch();

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Registro médico creado exitosamente',
        'data' => [
            'id' => (int)$record['id'],
            'paciente_id' => (int)$record['paciente_id'],
            'fecha' => $record['fecha'],
            'medico_id' => (int)$record['medico_id'],
            'medico_name' => $record['medico_name'],
            'diagnostico' => $record['diagnostico'],
            'tratamiento' => $record['tratamiento'],
            'medicamentos' => $record['medicamentos'],
            'observaciones' => $record['observaciones'],
            'adjuntos' => json_decode($record['adjuntos'], true),
            'created_at' => $record['created_at']
        ]
    ], 201);
}

// GET /api/medical-records/{id} - Obtener detalle de registro médico
function handleGetMedicalRecord(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("
        SELECT mr.*, 
               u.name as medico_name, u.email as medico_email,
               p.nombre as paciente_nombre, p.documento as paciente_documento,
               p.hospital_id
        FROM medical_records mr
        LEFT JOIN users u ON mr.medico_id = u.id
        LEFT JOIN patients p ON mr.paciente_id = p.id
        WHERE mr.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $record = $stmt->fetch();

    if (!$record) {
        Helpers::errorResponse('Registro médico no encontrado', 404);
    }

    // Verificar permisos
    if ((int)$user->role !== 1 && (int)$user->hospital !== (int)$record['hospital_id']) {
        Helpers::errorResponse('No tienes permiso para ver este registro', 403);
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => [
            'id' => (int)$record['id'],
            'paciente_id' => (int)$record['paciente_id'],
            'paciente_nombre' => $record['paciente_nombre'],
            'paciente_documento' => $record['paciente_documento'],
            'fecha' => $record['fecha'],
            'medico_id' => (int)$record['medico_id'],
            'medico_name' => $record['medico_name'],
            'medico_email' => $record['medico_email'],
            'diagnostico' => $record['diagnostico'],
            'tratamiento' => $record['tratamiento'],
            'medicamentos' => $record['medicamentos'],
            'observaciones' => $record['observaciones'],
            'adjuntos' => json_decode($record['adjuntos'], true),
            'created_at' => $record['created_at']
        ]
    ]);
}

