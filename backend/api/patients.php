<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/patients - Listar pacientes con paginación
function handleGetPatients(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
    $search = $_GET['search'] ?? '';
    $hospitalId = isset($_GET['hospital_id']) ? (int)$_GET['hospital_id'] : null;

    $whereConditions = ["p.is_active = 1"];
    $params = [];

    // Si no es admin, filtrar por hospital
    if ((int)$user->role !== 1 && $user->hospital) {
        $whereConditions[] = "p.hospital_id = :user_hospital";
        $params[':user_hospital'] = (int)$user->hospital;
    }

    if ($search) {
        $whereConditions[] = "(p.nombre LIKE :search OR p.documento LIKE :search)";
        $params[':search'] = "%{$search}%";
    }

    if ($hospitalId) {
        $whereConditions[] = "p.hospital_id = :hospital_id";
        $params[':hospital_id'] = $hospitalId;
    }

    $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);

    $countSql = "SELECT COUNT(*) as total FROM patients p {$whereClause}";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetch()['total'];

    $offset = ($page - 1) * $perPage;
    $sql = "SELECT p.*, h.name as hospital_nombre
            FROM patients p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            {$whereClause}
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $patients = $stmt->fetchAll();

    // Procesar alergias para cada paciente
    foreach ($patients as &$patient) {
        if (isset($patient['alergias']) && $patient['alergias']) {
            $alergiasArray = json_decode($patient['alergias'], true);
            if (is_array($alergiasArray)) {
                $patient['alergias'] = implode(', ', $alergiasArray);
            }
        } else {
            $patient['alergias'] = '';
        }
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $patients,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
}

// GET /api/patients/:id - Obtener un paciente
function handleGetPatient(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $sql = "SELECT p.*, h.name as hospital_nombre
            FROM patients p
            LEFT JOIN hospitals h ON p.hospital_id = h.id
            WHERE p.id = :id AND p.is_active = 1";

    // Si no es admin, filtrar por hospital
    if ((int)$user->role !== 1 && $user->hospital) {
        $sql .= " AND p.hospital_id = :hospital";
    }

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    if ((int)$user->role !== 1 && $user->hospital) {
        $stmt->bindValue(':hospital', (int)$user->hospital, PDO::PARAM_INT);
    }
    $stmt->execute();

    $patient = $stmt->fetch();

    if (!$patient) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    // Decodificar alergias de JSON a string para el frontend
    if (isset($patient['alergias']) && $patient['alergias']) {
        $alergiasArray = json_decode($patient['alergias'], true);
        if (is_array($alergiasArray)) {
            $patient['alergias'] = implode(', ', $alergiasArray);
        }
    } else {
        $patient['alergias'] = '';
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $patient
    ]);
}

// POST /api/patients - Crear paciente
function handleCreatePatient(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $input = Helpers::getJsonInput();
    $error = Helpers::validateRequired($input, ['nombre', 'documento', 'fecha_nac', 'tipo_sangre']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    // Si no es admin, usar su hospital
    $hospitalId = $input['hospital_id'] ?? null;
    if ((int)$user->role !== 1) {
        $hospitalId = $user->hospital;
    }

    if (!$hospitalId) {
        Helpers::errorResponse('hospital_id es requerido', 400);
    }

    $stmt = $db->prepare("
        INSERT INTO patients (nombre, documento, fecha_nac, edad, tipo_sangre, sexo, 
                              contacto_emergencia, hospital_id, alergias, condiciones_preexistentes, created_by)
        VALUES (:nombre, :documento, :fecha_nac, :edad, :tipo_sangre, :sexo,
                :contacto_emergencia, :hospital_id, :alergias, :condiciones, :created_by)
    ");

    // Calcular edad
    $edad = (new DateTime())->diff(new DateTime($input['fecha_nac']))->y;

    // Procesar alergias - convertir a JSON si es string
    $alergias = null;
    if (isset($input['alergias']) && is_string($input['alergias'])) {
        if (trim($input['alergias']) === '') {
            $alergias = json_encode([]);
        } else {
            $alergiasArray = array_map('trim', explode(',', $input['alergias']));
            $alergias = json_encode($alergiasArray);
        }
    } elseif (isset($input['alergias'])) {
        $alergias = json_encode($input['alergias']);
    }

    $stmt->execute([
        ':nombre' => $input['nombre'],
        ':documento' => $input['documento'],
        ':fecha_nac' => $input['fecha_nac'],
        ':edad' => $edad,
        ':tipo_sangre' => $input['tipo_sangre'],
        ':sexo' => $input['sexo'] ?? null,
        ':contacto_emergencia' => $input['contacto_emergencia'] ?? null,
        ':hospital_id' => $hospitalId,
        ':alergias' => $alergias,
        ':condiciones' => $input['condiciones_preexistentes'] ?? null,
        ':created_by' => $user->id
    ]);

    $patientId = (int)$db->lastInsertId();

    Helpers::auditLog('patients', 'create', $patientId, null, $input, (int)$user->id);

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Paciente creado exitosamente',
        'data' => ['id' => $patientId]
    ], 201);
}

// PUT /api/patients/:id - Actualizar paciente
function handleUpdatePatient(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $input = Helpers::getJsonInput();

    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM patients WHERE id = :id AND is_active = 1");
    $stmt->execute([':id' => $id]);
    $oldPatient = $stmt->fetch();

    if (!$oldPatient) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    // Si no es admin, verificar hospital
    if ((int)$user->role !== 1 && (int)$oldPatient['hospital_id'] !== (int)$user->hospital) {
        Helpers::errorResponse('No autorizado', 403);
    }

    $updates = [];
    $params = [':id' => $id];

    $allowedFields = ['nombre', 'documento', 'fecha_nac', 'tipo_sangre', 'sexo', 
                     'contacto_emergencia', 'alergias', 'condiciones_preexistentes'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "{$field} = :{$field}";
            
            // Convertir alergias a JSON si es string
            if ($field === 'alergias' && is_string($input[$field])) {
                // Si es un string vacío, convertir a array vacío
                if (trim($input[$field]) === '') {
                    $params[":{$field}"] = json_encode([]);
                } else {
                    // Si es un string con comas, convertir a array
                    $alergias = array_map('trim', explode(',', $input[$field]));
                    $params[":{$field}"] = json_encode($alergias);
                }
            } else {
                $params[":{$field}"] = $input[$field];
            }
        }
    }

    // Recalcular edad si cambia fecha_nac
    if (isset($input['fecha_nac'])) {
        $edad = (new DateTime())->diff(new DateTime($input['fecha_nac']))->y;
        $updates[] = "edad = :edad";
        $params[':edad'] = $edad;
    }

    if (empty($updates)) {
        Helpers::errorResponse('No hay datos para actualizar', 400);
    }

    $updates[] = "updated_at = NOW()";
    $sql = "UPDATE patients SET " . implode(', ', $updates) . " WHERE id = :id";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    Helpers::auditLog('patients', 'update', $id, $oldPatient, $input, (int)$user->id);

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Paciente actualizado exitosamente'
    ]);
}

// DELETE /api/patients/:id - Eliminar (soft delete)
function handleDeletePatient(int $id): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    $stmt = $db->prepare("UPDATE patients SET is_active = 0, updated_at = NOW() WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    Helpers::auditLog('patients', 'delete', $id, null, null, (int)$user->id);

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Paciente eliminado exitosamente'
    ]);
}

// GET /api/patients/:id/medical-records - Historial médico
function handleGetPatientMedicalRecords(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $sql = "SELECT mr.*, u.name as medico_nombre
            FROM medical_records mr
            LEFT JOIN users u ON mr.medico_id = u.id
            WHERE mr.paciente_id = :id
            ORDER BY mr.fecha DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $id]);
    $records = $stmt->fetchAll();

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $records
    ]);
}

// GET /api/patients/:id/emergencias - Emergencias del paciente
function handleGetPatientEmergencias(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $sql = "SELECT e.*, h.name as hospital_nombre
            FROM emergencias e
            LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
            WHERE e.paciente_id = :id
            ORDER BY e.fecha DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $id]);
    $emergencias = $stmt->fetchAll();

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $emergencias
    ]);
}

// GET /api/patients/:id/vitals - Signos vitales del paciente
function handleGetPatientVitals(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

    $sql = "SELECT * FROM vitals
            WHERE paciente_id = :id
            ORDER BY fecha DESC
            LIMIT :limit";

    $stmt = $db->prepare($sql);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $vitals = $stmt->fetchAll();

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $vitals
    ]);
}
