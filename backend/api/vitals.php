<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/vitals - Listar signos vitales
function handleGetVitals(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $pacienteId = isset($_GET['paciente_id']) ? (int)$_GET['paciente_id'] : null;
    $emergenciaId = isset($_GET['emergencia_id']) ? (int)$_GET['emergencia_id'] : null;
    $tipo = $_GET['tipo'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;

    $whereConditions = [];
    $params = [];

    if ($pacienteId) {
        $whereConditions[] = "paciente_id = :paciente_id";
        $params[':paciente_id'] = $pacienteId;
    }

    if ($emergenciaId) {
        $whereConditions[] = "emergencia_id = :emergencia_id";
        $params[':emergencia_id'] = $emergenciaId;
    }

    if ($tipo) {
        $whereConditions[] = "tipo = :tipo";
        $params[':tipo'] = $tipo;
    }

    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

    $sql = "SELECT * FROM vitals {$whereClause} ORDER BY fecha DESC LIMIT :limit";
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $vitals = $stmt->fetchAll();

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $vitals
    ]);
}

// POST /api/vitals - Crear signo vital
function handleCreateVital(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $input = Helpers::getJsonInput();
    $error = Helpers::validateRequired($input, ['paciente_id', 'tipo', 'valor']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    $stmt = $db->prepare("
        INSERT INTO vitals (paciente_id, emergencia_id, tipo, valor, unidad, registrado_por, fecha)
        VALUES (:paciente_id, :emergencia_id, :tipo, :valor, :unidad, :registrado_por, NOW())
    ");

    $stmt->execute([
        ':paciente_id' => (int)$input['paciente_id'],
        ':emergencia_id' => isset($input['emergencia_id']) ? (int)$input['emergencia_id'] : null,
        ':tipo' => $input['tipo'],
        ':valor' => $input['valor'],
        ':unidad' => $input['unidad'] ?? null,
        ':registrado_por' => (int)$user->id
    ]);

    $vitalId = (int)$db->lastInsertId();

    // Evaluar si es crítico y crear alerta
    evaluarVitalCritico($input['tipo'], $input['valor'], (int)$input['paciente_id'], $db, (int)$user->id);

    Helpers::jsonResponse([
        'status' => 'success',
        'message' => 'Signo vital registrado exitosamente',
        'data' => ['id' => $vitalId]
    ], 201);
}

// GET /api/vitals/:id - Obtener un signo vital
function handleGetVital(int $id): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $stmt = $db->prepare("SELECT * FROM vitals WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $vital = $stmt->fetch();

    if (!$vital) {
        Helpers::errorResponse('Signo vital no encontrado', 404);
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => $vital
    ]);
}

// Función auxiliar para evaluar si un vital es crítico
function evaluarVitalCritico(string $tipo, string $valor, int $pacienteId, PDO $db, int $userId): void
{
    try {
        $esCritico = false;
        $mensaje = '';

        switch ($tipo) {
            case 'SPO2':
                if ((int)$valor < 90) {
                    $esCritico = true;
                    $mensaje = "SpO₂ crítico: {$valor}%";
                }
                break;
            case 'HR':
                $hr = (int)$valor;
                if ($hr < 50 || $hr > 120) {
                    $esCritico = true;
                    $mensaje = "Frecuencia cardíaca anormal: {$valor} bpm";
                }
                break;
            case 'BP':
                $parts = explode('/', $valor);
                if (count($parts) === 2) {
                    $sistolica = (int)$parts[0];
                    if ($sistolica < 90 || $sistolica > 180) {
                        $esCritico = true;
                        $mensaje = "Presión arterial crítica: {$valor}";
                    }
                }
                break;
            case 'TEMP':
                $temp = (float)$valor;
                if ($temp < 35.0 || $temp > 39.0) {
                    $esCritico = true;
                    $mensaje = "Temperatura anormal: {$valor}°C";
                }
                break;
        }

        if ($esCritico) {
            crearAlertaVitalCritico($pacienteId, $mensaje, $db, $userId);
        }
    } catch (Exception $e) {
        error_log("Error evaluando vital crítico: " . $e->getMessage());
    }
}

// Función auxiliar para crear alerta
function crearAlertaVitalCritico(int $pacienteId, string $mensaje, PDO $db, int $userId): void
{
    try {
        // Obtener datos del paciente
        $stmt = $db->prepare("SELECT nombre, hospital_id FROM patients WHERE id = :id");
        $stmt->execute([':id' => $pacienteId]);
        $paciente = $stmt->fetch();

        if (!$paciente) {
            return;
        }

        // Crear notificación para médicos del hospital
        $stmt = $db->prepare("
            SELECT id FROM users 
            WHERE hospital_id = :hospital_id 
            AND role_id IN (1, 2) 
            AND is_active = 1
        ");
        $stmt->execute([':hospital_id' => (int)$paciente['hospital_id']]);
        $medicos = $stmt->fetchAll();

        foreach ($medicos as $medico) {
            $stmtNotif = $db->prepare("
                INSERT INTO notifications (user_id, tipo, titulo, mensaje, paciente_id, created_at)
                VALUES (:user_id, 'vital_critico', :titulo, :mensaje, :paciente_id, NOW())
            ");
            $stmtNotif->execute([
                ':user_id' => (int)$medico['id'],
                ':titulo' => '⚠️ Signo Vital Crítico',
                ':mensaje' => "Paciente {$paciente['nombre']}: {$mensaje}",
                ':paciente_id' => $pacienteId
            ]);
        }
    } catch (Exception $e) {
        error_log("Error creando alerta vital crítico: " . $e->getMessage());
    }
}
