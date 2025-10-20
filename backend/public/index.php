<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

use App\Db;

// Test database connection
try {
    Db::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit;
}

// Routing
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$requestUri = strtok($requestUri, '?');

// Remove /api prefix if present
$requestUri = preg_replace('#^/api#', '', $requestUri);

// Load API handlers
require_once __DIR__ . '/../api/auth.php';
require_once __DIR__ . '/../api/roles.php';
require_once __DIR__ . '/../api/users.php';
require_once __DIR__ . '/../api/hospitals.php';
require_once __DIR__ . '/../api/patients.php';
require_once __DIR__ . '/../api/medical-records.php';
require_once __DIR__ . '/../api/emergencias.php';
require_once __DIR__ . '/../api/vitals.php';
require_once __DIR__ . '/../api/notifications.php';
require_once __DIR__ . '/../api/reports.php';

// Routes
try {
    // Auth routes
    if ($requestUri === '/auth/login' && $requestMethod === 'POST') {
        handleLogin();
    } elseif ($requestUri === '/auth/register' && $requestMethod === 'POST') {
        handleRegister();
    } elseif ($requestUri === '/auth/me' && $requestMethod === 'GET') {
        handleMe();
    }
    
    // Roles routes
    elseif ($requestUri === '/roles' && $requestMethod === 'GET') {
        handleGetRoles();
    }
    
    // Users routes
    elseif ($requestUri === '/users' && $requestMethod === 'GET') {
        handleGetUsers();
    } elseif ($requestUri === '/users' && $requestMethod === 'POST') {
        handleCreateUser();
    } elseif (preg_match('#^/users/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetUser((int)$matches[1]);
    } elseif (preg_match('#^/users/(\d+)$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleUpdateUser((int)$matches[1]);
    } elseif (preg_match('#^/users/(\d+)$#', $requestUri, $matches) && $requestMethod === 'DELETE') {
        handleDeleteUser((int)$matches[1]);
    }
    
    // Hospitals routes
    elseif ($requestUri === '/hospitals' && $requestMethod === 'GET') {
        handleGetHospitals();
    } elseif ($requestUri === '/hospitals' && $requestMethod === 'POST') {
        handleCreateHospital();
    } elseif (preg_match('#^/hospitals/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetHospital((int)$matches[1]);
    } elseif (preg_match('#^/hospitals/(\d+)$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleUpdateHospital((int)$matches[1]);
    } elseif (preg_match('#^/hospitals/(\d+)$#', $requestUri, $matches) && $requestMethod === 'DELETE') {
        handleDeleteHospital((int)$matches[1]);
    }
    
    // Patients routes
    elseif ($requestUri === '/patients' && $requestMethod === 'GET') {
        handleGetPatients();
    } elseif ($requestUri === '/patients' && $requestMethod === 'POST') {
        handleCreatePatient();
    } elseif (preg_match('#^/patients/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetPatient((int)$matches[1]);
    } elseif (preg_match('#^/patients/(\d+)$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleUpdatePatient((int)$matches[1]);
    } elseif (preg_match('#^/patients/(\d+)$#', $requestUri, $matches) && $requestMethod === 'DELETE') {
        handleDeletePatient((int)$matches[1]);
    } elseif (preg_match('#^/patients/(\d+)/medical-records$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetPatientMedicalRecords((int)$matches[1]);
    } elseif (preg_match('#^/patients/(\d+)/emergencias$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetPatientEmergencias((int)$matches[1]);
    } elseif (preg_match('#^/patients/(\d+)/vitals$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetPatientVitals((int)$matches[1]);
    }
    
    // Medical Records routes
    elseif ($requestUri === '/medical-records' && $requestMethod === 'GET') {
        handleGetMedicalRecords();
    } elseif ($requestUri === '/medical-records' && $requestMethod === 'POST') {
        handleCreateMedicalRecord();
    } elseif (preg_match('#^/medical-records/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetMedicalRecord((int)$matches[1]);
    } elseif (preg_match('#^/medical-records/(\d+)$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleUpdateMedicalRecord((int)$matches[1]);
    } elseif (preg_match('#^/medical-records/(\d+)$#', $requestUri, $matches) && $requestMethod === 'DELETE') {
        handleDeleteMedicalRecord((int)$matches[1]);
    }
    
    // Emergencias routes
    elseif ($requestUri === '/emergencias' && $requestMethod === 'GET') {
        handleGetEmergencias();
    } elseif ($requestUri === '/emergencias' && $requestMethod === 'POST') {
        handleCreateEmergencia();
    } elseif (preg_match('#^/emergencias/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetEmergencia((int)$matches[1]);
    } elseif (preg_match('#^/emergencias/(\d+)$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleUpdateEmergencia((int)$matches[1]);
    } elseif (preg_match('#^/emergencias/(\d+)$#', $requestUri, $matches) && $requestMethod === 'DELETE') {
        handleDeleteEmergencia((int)$matches[1]);
    }
    
    // Vitals routes
    elseif ($requestUri === '/vitals' && $requestMethod === 'GET') {
        handleGetVitals();
    } elseif ($requestUri === '/vitals' && $requestMethod === 'POST') {
        handleCreateVital();
    } elseif (preg_match('#^/vitals/(\d+)$#', $requestUri, $matches) && $requestMethod === 'GET') {
        handleGetVital((int)$matches[1]);
    }
    
    // Notifications routes
    elseif ($requestUri === '/notifications' && $requestMethod === 'GET') {
        handleGetNotifications();
    } elseif (preg_match('#^/notifications/(\d+)/read$#', $requestUri, $matches) && $requestMethod === 'PUT') {
        handleMarkNotificationAsRead((int)$matches[1]);
    } elseif ($requestUri === '/notifications/mark-all-read' && $requestMethod === 'PUT') {
        handleMarkAllNotificationsAsRead();
    }
    
    // Reports routes
    elseif ($requestUri === '/reports/dashboard' && $requestMethod === 'GET') {
        handleGetDashboardStats();
    } elseif ($requestUri === '/reports/export/patients' && $requestMethod === 'GET') {
        handleExportPatients();
    } elseif ($requestUri === '/reports/export/emergencias' && $requestMethod === 'GET') {
        handleExportEmergencias();
    }
    
    // 404 Not Found
    else {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Ruta no encontrada: ' . $requestMethod . ' ' . $requestUri
        ]);
    }
} catch (Exception $e) {
    error_log('Error en index.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'details' => $e->getMessage()
    ]);
}




