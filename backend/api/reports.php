<?php

use App\Db;
use App\Helpers;
use App\AuthMiddleware;

// GET /api/reports/dashboard - Estadísticas del dashboard
function handleGetDashboardStats(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $hospitalFilter = '';
    $params = [];

    // Si no es admin, filtrar por hospital
    if ((int)$user->role !== 1 && $user->hospital) {
        $hospitalFilter = 'WHERE hospital_id = :hospital';
        $params[':hospital'] = (int)$user->hospital;
    }

    // Total de pacientes
    $whereClause = $hospitalFilter ? "{$hospitalFilter} AND is_active = 1" : "WHERE is_active = 1";
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM patients {$whereClause}");
    $stmt->execute($params);
    $totalPacientes = (int)$stmt->fetch()['total'];

    // Emergencias activas
    $emergenciasFilter = $hospitalFilter ? str_replace('hospital_id', 'hospital_destino_id', $hospitalFilter) : '';
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM emergencias {$emergenciasFilter}" . ($emergenciasFilter ? " AND" : "WHERE") . " estado = 'en_traslado'");
    $stmt->execute($params);
    $emergenciasActivas = (int)$stmt->fetch()['total'];

    // Emergencias hoy
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM emergencias {$emergenciasFilter}" . ($emergenciasFilter ? " AND" : "WHERE") . " DATE(fecha) = CURDATE()");
    $stmt->execute($params);
    $emergenciasHoy = (int)$stmt->fetch()['total'];

    // Consultas esta semana
    $stmt = $db->prepare("
        SELECT COUNT(*) as total 
        FROM medical_records mr
        INNER JOIN patients p ON mr.paciente_id = p.id
        WHERE WEEK(mr.fecha) = WEEK(NOW())
        " . ($hospitalFilter ? "AND p.hospital_id = :hospital" : "")
    );
    $stmt->execute($params);
    $consultasSemana = (int)$stmt->fetch()['total'];

    // Pacientes críticos (con signos vitales críticos en últimas 24h)
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT v.paciente_id) as total
        FROM vitals v
        INNER JOIN patients p ON v.paciente_id = p.id
        WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND (
            (v.tipo = 'SPO2' AND CAST(v.valor AS UNSIGNED) < 90) OR
            (v.tipo = 'HR' AND (CAST(v.valor AS UNSIGNED) < 50 OR CAST(v.valor AS UNSIGNED) > 120))
          )
        " . ($hospitalFilter ? "AND p.hospital_id = :hospital" : "")
    );
    $stmt->execute($params);
    $pacientesCriticos = (int)$stmt->fetch()['total'];

    // Últimas emergencias
    $stmt = $db->prepare("
        SELECT e.id, e.fecha, e.estado, e.unidad,
               p.nombre as paciente_nombre
        FROM emergencias e
        INNER JOIN patients p ON e.paciente_id = p.id
        {$emergenciasFilter}
        ORDER BY e.fecha DESC
        LIMIT 5
    ");
    $stmt->execute($params);
    $ultimasEmergencias = $stmt->fetchAll();

    // Distribución de emergencias por día (última semana)
    $stmt = $db->prepare("
        SELECT DATE(fecha) as dia, COUNT(*) as total
        FROM emergencias
        {$emergenciasFilter}
        " . ($emergenciasFilter ? "AND" : "WHERE") . " fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(fecha)
        ORDER BY dia
    ");
    $stmt->execute($params);
    $emergenciasPorDia = $stmt->fetchAll();

    // Alertas críticas (últimos signos vitales críticos)
    $stmt = $db->prepare("
        SELECT v.id, v.paciente_id, p.nombre as paciente_nombre, p.documento as paciente_documento,
               v.tipo, v.valor, v.unidad, v.fecha
        FROM vitals v
        INNER JOIN patients p ON v.paciente_id = p.id
        WHERE v.fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          AND (
            (v.tipo = 'SPO2' AND CAST(v.valor AS UNSIGNED) < 90) OR
            (v.tipo = 'HR' AND (CAST(v.valor AS UNSIGNED) < 50 OR CAST(v.valor AS UNSIGNED) > 120)) OR
            (v.tipo = 'BP' AND (
                CAST(SUBSTRING_INDEX(v.valor, '/', 1) AS UNSIGNED) < 90 OR
                CAST(SUBSTRING_INDEX(v.valor, '/', 1) AS UNSIGNED) > 180
            ))
          )
        " . ($hospitalFilter ? "AND p.hospital_id = :hospital" : "") . "
        ORDER BY v.fecha DESC
        LIMIT 10
    ");
    $stmt->execute($params);
    $alertasCriticas = $stmt->fetchAll();

    // Pacientes recientes con últimos signos vitales
    $stmt = $db->prepare("
        SELECT DISTINCT p.id, p.nombre, p.documento, p.edad, p.tipo_sangre,
               (SELECT MAX(mr.fecha) FROM medical_records mr WHERE mr.paciente_id = p.id) as ultima_consulta,
               (SELECT v1.valor FROM vitals v1 WHERE v1.paciente_id = p.id AND v1.tipo = 'BP' ORDER BY v1.fecha DESC LIMIT 1) as pa,
               (SELECT v2.valor FROM vitals v2 WHERE v2.paciente_id = p.id AND v2.tipo = 'HR' ORDER BY v2.fecha DESC LIMIT 1) as pulso,
               (SELECT v3.valor FROM vitals v3 WHERE v3.paciente_id = p.id AND v3.tipo = 'SPO2' ORDER BY v3.fecha DESC LIMIT 1) as spo2,
               (SELECT v4.valor FROM vitals v4 WHERE v4.paciente_id = p.id AND v4.tipo = 'TEMP' ORDER BY v4.fecha DESC LIMIT 1) as temp
        FROM patients p
        WHERE p.is_active = 1
        " . ($hospitalFilter ? "AND p.hospital_id = :hospital" : "") . "
        ORDER BY (SELECT MAX(COALESCE(mr.fecha, e.fecha, v.fecha)) 
                  FROM medical_records mr 
                  LEFT JOIN emergencias e ON e.paciente_id = p.id
                  LEFT JOIN vitals v ON v.paciente_id = p.id
                  WHERE mr.paciente_id = p.id OR e.paciente_id = p.id OR v.paciente_id = p.id) DESC
        LIMIT 10
    ");
    $stmt->execute($params);
    $pacientesRecientes = $stmt->fetchAll();

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => [
            'totales' => [
                'pacientes' => $totalPacientes,
                'emergencias_activas' => $emergenciasActivas,
                'emergencias_hoy' => $emergenciasHoy,
                'consultas_semana' => $consultasSemana,
                'pacientes_criticos' => $pacientesCriticos
            ],
            'ultimas_emergencias' => $ultimasEmergencias,
            'emergencias_por_dia' => $emergenciasPorDia,
            'alertas_criticas' => $alertasCriticas,
            'pacientes_recientes' => array_map(function($p) {
                return [
                    'id' => (int)$p['id'],
                    'nombre' => $p['nombre'],
                    'documento' => $p['documento'],
                    'edad' => (int)$p['edad'],
                    'tipo_sangre' => $p['tipo_sangre'],
                    'ultima_consulta' => $p['ultima_consulta'],
                    'signos_vitales' => [
                        'pa' => $p['pa'],
                        'pulso' => $p['pulso'] ? (int)$p['pulso'] : null,
                        'spo2' => $p['spo2'] ? (int)$p['spo2'] : null,
                        'temp' => $p['temp'] ? (float)$p['temp'] : null,
                    ]
                ];
            }, $pacientesRecientes)
        ]
    ]);
}

// GET /api/reports/export/patients - Exportar pacientes a CSV
function handleExportPatients(): void
{
    $user = AuthMiddleware::requireAdmin();
    $db = Db::getInstance();

    $stmt = $db->query("
        SELECT p.nombre, p.documento, p.fecha_nac, p.edad, p.tipo_sangre, 
               p.contacto_emergencia, h.name as hospital, p.created_at
        FROM patients p
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        WHERE p.is_active = 1
        ORDER BY p.nombre
    ");
    $patients = $stmt->fetchAll();

    // Generar CSV
    $csv = "Nombre,Documento,Fecha Nacimiento,Edad,Tipo Sangre,Contacto Emergencia,Hospital,Fecha Registro\n";
    
    foreach ($patients as $p) {
        $csv .= sprintf(
            '"%s","%s","%s",%d,"%s","%s","%s","%s"' . "\n",
            $p['nombre'],
            $p['documento'],
            $p['fecha_nac'],
            $p['edad'],
            $p['tipo_sangre'],
            $p['contacto_emergencia'],
            $p['hospital'],
            $p['created_at']
        );
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => [
            'filename' => 'pacientes_' . date('Y-m-d') . '.csv',
            'content' => base64_encode($csv),
            'mime_type' => 'text/csv'
        ]
    ]);
}

// GET /api/reports/export/emergencias - Exportar emergencias a CSV
function handleExportEmergencias(): void
{
    $user = AuthMiddleware::authenticate();
    $db = Db::getInstance();

    $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
    $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

    $stmt = $db->prepare("
        SELECT e.fecha, p.nombre as paciente, p.documento, e.unidad, e.descripcion,
               e.estado, h.name as hospital, para.name as paramedico
        FROM emergencias e
        INNER JOIN patients p ON e.paciente_id = p.id
        LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
        LEFT JOIN users para ON e.registrado_por = para.id
        WHERE DATE(e.fecha) BETWEEN :inicio AND :fin
        ORDER BY e.fecha DESC
    ");
    $stmt->execute([':inicio' => $fechaInicio, ':fin' => $fechaFin]);
    $emergencias = $stmt->fetchAll();

    // Generar CSV
    $csv = "Fecha,Paciente,Documento,Unidad,Descripción,Estado,Hospital,Paramédico\n";
    
    foreach ($emergencias as $e) {
        $csv .= sprintf(
            '"%s","%s","%s","%s","%s","%s","%s","%s"' . "\n",
            $e['fecha'],
            $e['paciente'],
            $e['documento'],
            $e['unidad'],
            str_replace('"', '""', $e['descripcion']),
            $e['estado'],
            $e['hospital'],
            $e['paramedico']
        );
    }

    Helpers::jsonResponse([
        'status' => 'success',
        'data' => [
            'filename' => 'emergencias_' . $fechaInicio . '_' . $fechaFin . '.csv',
            'content' => base64_encode($csv),
            'mime_type' => 'text/csv'
        ]
    ]);
}

