<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/emergencias - Listar emergencias
function handleGetEmergencias(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    // Parámetros
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 20)));
    $estado = $_GET['estado'] ?? '';
    $hospitalId = isset($_GET['hospital_id']) ? (int)$_GET['hospital_id'] : null;

    $whereConditions = [];
    $params = [];

    if ($estado) {
        $whereConditions[] = "e.estado = :estado";
        $params[':estado'] = $estado;
    }

    if ($hospitalId) {
        $whereConditions[] = "e.hospital_destino_id = :hospital_id";
        $params[':hospital_id'] = $hospitalId;
    }

    // Si no es admin, filtrar por hospital del usuario
    if ((int)$user->role !== 1 && $user->hospital) {
        $whereConditions[] = "e.hospital_destino_id = :user_hospital";
        $params[':user_hospital'] = (int)$user->hospital;
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    // Contar total
    $countSql = "SELECT COUNT(*) as total FROM emergencias e {$whereClause}";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetch()['total'];

    // Obtener emergencias
    $offset = ($page - 1) * $perPage;
    $sql = "
        SELECT e.*,
               p.nombre as paciente_nombre, p.documento as paciente_documento, 
               p.tipo_sangre as paciente_tipo_sangre, p.alergias as paciente_alergias,
               h.name as hospital_nombre,
               para.name as paramedico_nombre,
               med.name as medico_nombre
        FROM emergencias e
        INNER JOIN patients p ON e.paciente_id = p.id
        LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
        LEFT JOIN users para ON e.registrado_por = para.id
        LEFT JOIN users med ON e.atendido_por = med.id
        {$whereClause}
        ORDER BY e.fecha DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $emergencias = $stmt->fetchAll();

    $data = array_map(function($e) {
        $signosVitales = json_decode($e['signos_vitales'], true);
        
        return [
            'id' => (int)$e['id'],
            'paciente_id' => (int)$e['paciente_id'],
            'paciente_nombre' => $e['paciente_nombre'],
            'paciente_documento' => $e['paciente_documento'],
            'paciente_tipo_sangre' => $e['paciente_tipo_sangre'],
            'paciente_alergias' => json_decode($e['paciente_alergias'], true),
            'fecha' => $e['fecha'],
            'signos_vitales' => $signosVitales,
            'unidad' => $e['unidad'],
            'descripcion' => $e['descripcion'],
            'ubicacion' => $e['ubicacion'],
            'geo_lat' => $e['geo_lat'] ? (float)$e['geo_lat'] : null,
            'geo_long' => $e['geo_long'] ? (float)$e['geo_long'] : null,
            'estado' => $e['estado'],
            'hospital_destino_id' => $e['hospital_destino_id'] ? (int)$e['hospital_destino_id'] : null,
            'hospital_nombre' => $e['hospital_nombre'],
            'registrado_por' => (int)$e['registrado_por'],
            'paramedico_nombre' => $e['paramedico_nombre'],
            'atendido_por' => $e['atendido_por'] ? (int)$e['atendido_por'] : null,
            'medico_nombre' => $e['medico_nombre'],
            'created_at' => $e['created_at'],
            'updated_at' => $e['updated_at'],
            'alerta_critica' => evaluarCriticidad($signosVitales)
        ];
    }, $emergencias);

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

// GET /api/emergencias/{id} - Obtener detalle de emergencia
function handleGetEmergencia(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("
        SELECT e.*,
               p.nombre as paciente_nombre, p.documento as paciente_documento,
               p.fecha_nac, p.edad, p.tipo_sangre, p.alergias, p.contacto_emergencia,
               h.name as hospital_nombre, h.address as hospital_address, h.phone as hospital_phone,
               para.name as paramedico_nombre, para.email as paramedico_email,
               med.name as medico_nombre, med.email as medico_email
        FROM emergencias e
        INNER JOIN patients p ON e.paciente_id = p.id
        LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
        LEFT JOIN users para ON e.registrado_por = para.id
        LEFT JOIN users med ON e.atendido_por = med.id
        WHERE e.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $emergencia = $stmt->fetch();

    if (!$emergencia) {
        Helpers::errorResponse('Emergencia no encontrada', 404);
    }

    // Obtener todos los signos vitales registrados para esta emergencia
    $stmt = $db->prepare("
        SELECT * FROM vitals 
        WHERE emergencia_id = :id 
        ORDER BY fecha DESC
    ");
    $stmt->execute([':id' => $id]);
    $vitals = $stmt->fetchAll();

    // Obtener historial de estados
    $stmt = $db->prepare("
        SELECT eh.*, u.name as usuario_nombre
        FROM emergencias_estados_historial eh
        LEFT JOIN users u ON eh.usuario_id = u.id
        WHERE eh.emergencia_id = :id
        ORDER BY eh.created_at DESC
    ");
    $stmt->execute([':id' => $id]);
    $historialEstados = $stmt->fetchAll();

    $signosVitales = json_decode($emergencia['signos_vitales'], true);

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => [
            'id' => (int)$emergencia['id'],
            'paciente_id' => (int)$emergencia['paciente_id'],
            'paciente_nombre' => $emergencia['paciente_nombre'],
            'paciente_documento' => $emergencia['paciente_documento'],
            'paciente_tipo_sangre' => $emergencia['tipo_sangre'],
            'paciente_alergias' => json_decode($emergencia['alergias'], true) ?: [],
            'fecha' => $emergencia['fecha'],
            'signos_vitales' => $signosVitales,
            'unidad' => $emergencia['unidad'],
            'descripcion' => $emergencia['descripcion'],
            'ubicacion' => $emergencia['ubicacion'],
            'geo_lat' => $emergencia['geo_lat'] ? (float)$emergencia['geo_lat'] : null,
            'geo_long' => $emergencia['geo_long'] ? (float)$emergencia['geo_long'] : null,
            'estado' => $emergencia['estado'],
            'hospital_destino_id' => $emergencia['hospital_destino_id'] ? (int)$emergencia['hospital_destino_id'] : null,
            'hospital_nombre' => $emergencia['hospital_nombre'],
            'registrado_por' => (int)$emergencia['registrado_por'],
            'paramedico_nombre' => $emergencia['paramedico_nombre'],
            'atendido_por' => $emergencia['atendido_por'] ? (int)$emergencia['atendido_por'] : null,
            'medico_nombre' => $emergencia['medico_nombre'],
            'vitals_history' => $vitals,
            'historial_estados' => $historialEstados,
            'alerta_critica' => evaluarCriticidad($signosVitales),
            'created_at' => $emergencia['created_at'],
            'updated_at' => $emergencia['updated_at']
        ]
    ]);
}

// POST /api/emergencias - Crear emergencia
function handleCreateEmergencia(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Validar campos requeridos
    $error = Helpers::validateRequired($input, ['paciente_id', 'signos_vitales', 'unidad', 'descripcion']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $pacienteId = (int)$input['paciente_id'];
    $fecha = $input['fecha'] ?? date('Y-m-d H:i:s');
    $signosVitales = $input['signos_vitales'];
    $unidad = trim($input['unidad']);
    $descripcion = trim($input['descripcion']);
    $ubicacion = trim($input['ubicacion'] ?? '');
    $geoLat = isset($input['geo_lat']) ? (float)$input['geo_lat'] : null;
    $geoLong = isset($input['geo_long']) ? (float)$input['geo_long'] : null;
    $hospitalDestinoId = isset($input['hospital_destino_id']) ? (int)$input['hospital_destino_id'] : null;

    // Verificar que el paciente existe
    $stmt = $db->prepare("SELECT id, hospital_id FROM patients WHERE id = :id AND is_active = 1");
    $stmt->execute([':id' => $pacienteId]);
    $patient = $stmt->fetch();

    if (!$patient) {
        Helpers::errorResponse('Paciente no encontrado', 404);
    }

    // Si no se especifica hospital destino, usar el del paciente
    if (!$hospitalDestinoId) {
        $hospitalDestinoId = (int)$patient['hospital_id'];
    }

    // Crear emergencia
    $stmt = $db->prepare("
        INSERT INTO emergencias (paciente_id, fecha, signos_vitales, unidad, descripcion, 
                                ubicacion, geo_lat, geo_long, hospital_destino_id, registrado_por)
        VALUES (:paciente, :fecha, :signos, :unidad, :descripcion, :ubicacion, 
                :lat, :long, :hospital, :registrado)
    ");
    $stmt->execute([
        ':paciente' => $pacienteId,
        ':fecha' => $fecha,
        ':signos' => json_encode($signosVitales, JSON_UNESCAPED_UNICODE),
        ':unidad' => $unidad,
        ':descripcion' => $descripcion,
        ':ubicacion' => $ubicacion,
        ':lat' => $geoLat,
        ':long' => $geoLong,
        ':hospital' => $hospitalDestinoId,
        ':registrado' => (int)$user->sub
    ]);

    $emergenciaId = (int)$db->lastInsertId();

    // Registrar signos vitales individuales
    if (isset($signosVitales['pa'])) {
        $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'BP', ?, 'mmHg', ?)");
        $stmt->execute([$pacienteId, $emergenciaId, $fecha, $signosVitales['pa'], (int)$user->sub]);
    }
    if (isset($signosVitales['pulso'])) {
        $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'HR', ?, 'bpm', ?)");
        $stmt->execute([$pacienteId, $emergenciaId, $fecha, $signosVitales['pulso'], (int)$user->sub]);
    }
    if (isset($signosVitales['spo2'])) {
        $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'SPO2', ?, '%', ?)");
        $stmt->execute([$pacienteId, $emergenciaId, $fecha, $signosVitales['spo2'], (int)$user->sub]);
    }
    if (isset($signosVitales['temp'])) {
        $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'TEMP', ?, '°C', ?)");
        $stmt->execute([$pacienteId, $emergenciaId, $fecha, $signosVitales['temp'], (int)$user->sub]);
    }

    // Auditoría
    Helpers::logAudit($db, (int)$user->sub, 'create', 'emergencia', $emergenciaId, [
        'paciente_id' => $pacienteId,
        'unidad' => $unidad
    ]);

    // Crear notificaciones para médicos del hospital destino
    crearNotificacionesEmergencia($db, $emergenciaId, $pacienteId, $hospitalDestinoId, $signosVitales);

    // Obtener emergencia creada
    $stmt = $db->prepare("
        SELECT e.*, p.nombre as paciente_nombre, h.name as hospital_nombre
        FROM emergencias e
        INNER JOIN patients p ON e.paciente_id = p.id
        LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
        WHERE e.id = :id
    ");
    $stmt->execute([':id' => $emergenciaId]);
    $emergencia = $stmt->fetch();

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Emergencia creada exitosamente. Notificaciones enviadas.',
        'data' => [
            'id' => (int)$emergencia['id'],
            'paciente_id' => (int)$emergencia['paciente_id'],
            'paciente_nombre' => $emergencia['paciente_nombre'],
            'fecha' => $emergencia['fecha'],
            'signos_vitales' => json_decode($emergencia['signos_vitales'], true),
            'unidad' => $emergencia['unidad'],
            'descripcion' => $emergencia['descripcion'],
            'ubicacion' => $emergencia['ubicacion'],
            'estado' => $emergencia['estado'],
            'hospital_nombre' => $emergencia['hospital_nombre'],
            'alerta_critica' => evaluarCriticidad($signosVitales),
            'created_at' => $emergencia['created_at']
        ]
    ], 201);
}

// PUT /api/emergencias/{id} - Actualizar estado de emergencia
function handleUpdateEmergencia(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM emergencias WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $emergencia = $stmt->fetch();

    if (!$emergencia) {
        Helpers::errorResponse('Emergencia no encontrada', 404);
    }

    // Actualizar campos permitidos
    $updates = [];
    $params = [':id' => $id];

    // Manejar cambio de estado con validación y registro de historial
    if (isset($input['estado'])) {
        $estadoNuevo = $input['estado'];
        $estadoAnterior = $emergencia['estado'];
        
        // Validar estado
        $estadosValidos = ['en_camino', 'en_escena', 'en_traslado', 'en_hospital', 'en_atencion', 'estabilizado', 'dado_alta', 'cerrado'];
        if (!in_array($estadoNuevo, $estadosValidos)) {
            Helpers::errorResponse('Estado no válido', 400);
        }
        
        // Validar permisos según rol
        $roleId = (int)$user->role;
        $puedeActualizar = validarPermisoCambioEstado($roleId, $estadoAnterior, $estadoNuevo);
        
        if (!$puedeActualizar) {
            Helpers::errorResponse('No tiene permisos para realizar este cambio de estado', 403);
        }
        
        // Actualizar estado
        $updates[] = 'estado = :estado';
        $params[':estado'] = $estadoNuevo;
        
        // Registrar en historial de estados
        if ($estadoNuevo !== $estadoAnterior) {
            $observaciones = $input['observaciones'] ?? null;
            $stmt = $db->prepare("
                INSERT INTO emergencias_estados_historial 
                (emergencia_id, estado_anterior, estado_nuevo, usuario_id, observaciones)
                VALUES (:emergencia, :anterior, :nuevo, :usuario, :observaciones)
            ");
            $stmt->execute([
                ':emergencia' => $id,
                ':anterior' => $estadoAnterior,
                ':nuevo' => $estadoNuevo,
                ':usuario' => (int)$user->sub,
                ':observaciones' => $observaciones
            ]);
            
            // Si pasa a atención y no tiene médico asignado, asignar al usuario actual si es médico
            if ($estadoNuevo === 'en_atencion' && !$emergencia['atendido_por'] && $roleId === 2) {
                $updates[] = 'atendido_por = :atendido';
                $params[':atendido'] = (int)$user->sub;
            }
        }
    }

    // Actualizar atendido_por manualmente (solo médicos)
    if (isset($input['atendido_por']) && (int)$user->role === 2) {
        $updates[] = 'atendido_por = :atendido';
        $params[':atendido'] = (int)$input['atendido_por'];
    }

    // Actualizar signos vitales
    if (isset($input['signos_vitales'])) {
        $updates[] = 'signos_vitales = :signos';
        $params[':signos'] = json_encode($input['signos_vitales'], JSON_UNESCAPED_UNICODE);
        
        // Registrar nuevos signos vitales
        $fecha = date('Y-m-d H:i:s');
        $signosVitales = $input['signos_vitales'];
        $pacienteId = (int)$emergencia['paciente_id'];
        
        if (isset($signosVitales['pa'])) {
            $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'BP', ?, 'mmHg', ?)");
            $stmt->execute([$pacienteId, $id, $fecha, $signosVitales['pa'], (int)$user->sub]);
        }
        if (isset($signosVitales['pulso'])) {
            $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'HR', ?, 'bpm', ?)");
            $stmt->execute([$pacienteId, $id, $fecha, $signosVitales['pulso'], (int)$user->sub]);
        }
        if (isset($signosVitales['spo2'])) {
            $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'SPO2', ?, '%', ?)");
            $stmt->execute([$pacienteId, $id, $fecha, $signosVitales['spo2'], (int)$user->sub]);
        }
        if (isset($signosVitales['temp'])) {
            $stmt = $db->prepare("INSERT INTO vitals (paciente_id, emergencia_id, fecha, tipo, valor, unidad, registrado_por) VALUES (?, ?, ?, 'TEMP', ?, '°C', ?)");
            $stmt->execute([$pacienteId, $id, $fecha, $signosVitales['temp'], (int)$user->sub]);
        }
    }

    if (!empty($updates)) {
        $sql = "UPDATE emergencias SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Auditoría
        Helpers::logAudit($db, (int)$user->sub, 'update', 'emergencia', $id, $input);
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Emergencia actualizada exitosamente'
    ]);
}

// Validar permisos de cambio de estado según rol
function validarPermisoCambioEstado(int $roleId, string $estadoAnterior, string $estadoNuevo): bool
{
    // Rol 1: Administrador - puede cambiar cualquier estado
    if ($roleId === 1) {
        return true;
    }
    
    // Rol 3: Ambulancia/Paramédico - puede cambiar estados pre-hospitalarios
    if ($roleId === 3) {
        $estadosPermitidos = ['en_camino', 'en_escena', 'en_traslado', 'en_hospital'];
        return in_array($estadoNuevo, $estadosPermitidos);
    }
    
    // Rol 2: Médico - puede cambiar estados hospitalarios
    if ($roleId === 2) {
        $estadosPermitidos = ['en_hospital', 'en_atencion', 'estabilizado', 'dado_alta', 'cerrado'];
        return in_array($estadoNuevo, $estadosPermitidos);
    }
    
    return false;
}

// Funciones auxiliares
function evaluarCriticidad(array $signos): bool
{
    // Evaluar si los signos vitales son críticos
    $critico = false;

    // Presión arterial
    if (isset($signos['pa'])) {
        $pa = explode('/', $signos['pa']);
        if (count($pa) === 2) {
            $sistolica = (int)$pa[0];
            $diastolica = (int)$pa[1];
            if ($sistolica < 90 || $sistolica > 180 || $diastolica < 60 || $diastolica > 120) {
                $critico = true;
            }
        }
    }

    // Saturación de oxígeno
    if (isset($signos['spo2']) && (int)$signos['spo2'] < 90) {
        $critico = true;
    }

    // Pulso
    if (isset($signos['pulso'])) {
        $pulso = (int)$signos['pulso'];
        if ($pulso < 50 || $pulso > 120) {
            $critico = true;
        }
    }

    // Temperatura
    if (isset($signos['temp'])) {
        $temp = (float)$signos['temp'];
        if ($temp < 35 || $temp > 39) {
            $critico = true;
        }
    }

    return $critico;
}

function crearNotificacionesEmergencia($db, int $emergenciaId, int $pacienteId, int $hospitalId, array $signos): void
{
    try {
        // Obtener paciente
        $stmt = $db->prepare("SELECT nombre FROM patients WHERE id = :id");
        $stmt->execute([':id' => $pacienteId]);
        $paciente = $stmt->fetch();
        
        if (!$paciente) {
            error_log("Paciente no encontrado para notificación: ID $pacienteId");
            return;
        }

        // Obtener médicos del hospital
        $stmt = $db->prepare("SELECT id FROM users WHERE hospital_id = :hospital AND role_id = 2 AND is_active = 1");
        $stmt->execute([':hospital' => $hospitalId]);
        $medicos = $stmt->fetchAll();
        
        // Si no hay médicos, no crear notificaciones
        if (empty($medicos)) {
            error_log("No hay médicos activos en el hospital ID $hospitalId");
            return;
        }

        $critico = evaluarCriticidad($signos);
        $tipo = $critico ? 'emergencia_critica' : 'emergencia';
        $titulo = $critico ? '🚨 EMERGENCIA CRÍTICA' : 'Nueva Emergencia';
        $mensaje = "Paciente {$paciente['nombre']} en traslado. ";
        
        if ($critico) {
            $mensaje .= "Signos vitales críticos detectados. ";
        }
        
        if (isset($signos['spo2'])) {
            $mensaje .= "SpO2: {$signos['spo2']}% ";
        }
        if (isset($signos['pa'])) {
            $mensaje .= "PA: {$signos['pa']} ";
        }

        // Crear notificación para cada médico
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, tipo, titulo, mensaje, entity_type, entity_id)
            VALUES (:user, :tipo, :titulo, :mensaje, 'emergencia', :entity)
        ");

        foreach ($medicos as $medico) {
            $stmt->execute([
                ':user' => $medico['id'],
                ':tipo' => $tipo,
                ':titulo' => $titulo,
                ':mensaje' => $mensaje,
                ':entity' => $emergenciaId
            ]);
        }
    } catch (Exception $e) {
        // Log el error pero no interrumpir el flujo
        error_log("Error al crear notificaciones: " . $e->getMessage());
    }
}

