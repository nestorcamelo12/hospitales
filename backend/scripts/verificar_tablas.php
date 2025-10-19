<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Cargar variables de entorno
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

try {
    $host = $_ENV['DB_HOST'];
    $dbname = $_ENV['DB_NAME'];
    $user = $_ENV['DB_USER'];
    $pass = $_ENV['DB_PASSWORD'];
    
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Verificando Tablas en la Base de Datos ===\n\n";
    
    $requiredTables = [
        'roles',
        'hospitals',
        'users',
        'patients',
        'medical_records',
        'emergencias',
        'vitals',
        'notifications',
        'audit_logs'
    ];
    
    $missingTables = [];
    
    foreach ($requiredTables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->fetch();
        
        if ($exists) {
            echo "✅ Tabla '$table' existe\n";
        } else {
            echo "❌ Tabla '$table' NO existe\n";
            $missingTables[] = $table;
        }
    }
    
    echo "\n";
    
    if (empty($missingTables)) {
        echo "🎉 ¡Todas las tablas requeridas existen!\n";
    } else {
        echo "⚠️  Faltan " . count($missingTables) . " tabla(s):\n";
        foreach ($missingTables as $table) {
            echo "   - $table\n";
        }
        echo "\n";
        echo "💡 Para crear las tablas faltantes, ejecuta:\n";
        echo "   mysql -u root -p hospitales < scripts/db_schema_completo.sql\n";
        echo "\n";
        echo "   O desde phpMyAdmin:\n";
        echo "   1. Abre http://localhost/phpmyadmin\n";
        echo "   2. Selecciona la base de datos 'hospitales'\n";
        echo "   3. Click en 'SQL'\n";
        echo "   4. Copia el contenido de scripts/db_schema_completo.sql\n";
        echo "   5. Pega y ejecuta\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
