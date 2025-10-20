<?php
/**
 * Script para actualizar los estados de emergencias
 * Ejecutar: php backend/scripts/ejecutar_actualizacion_estados.php
 */

$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    die("Error: Archivo .env no encontrado.\n");
}

$env = parse_ini_file($envFile);

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║     ACTUALIZACIÓN DE ESTADOS DE EMERGENCIAS               ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $env['DB_HOST'] ?? '127.0.0.1',
        $env['DB_PORT'] ?? '3306',
        $env['DB_DATABASE'] ?? 'hospitales'
    );
    
    $db = new PDO(
        $dsn,
        $env['DB_USERNAME'] ?? 'root',
        $env['DB_PASSWORD'] ?? '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✅ Conexión exitosa\n\n";

    // Modificar columna estado
    echo "📝 Actualizando columna 'estado'...\n";
    $db->exec("
        ALTER TABLE emergencias 
        MODIFY COLUMN estado ENUM(
            'en_camino',
            'en_escena', 
            'en_traslado',
            'en_hospital',
            'en_atencion',
            'estabilizado',
            'dado_alta',
            'cerrado'
        ) DEFAULT 'en_camino'
    ");
    echo "✅ Columna 'estado' actualizada\n\n";

    // Agregar columna historial_estados si no existe
    echo "📝 Verificando columna 'historial_estados'...\n";
    $stmt = $db->query("SHOW COLUMNS FROM emergencias LIKE 'historial_estados'");
    if ($stmt->rowCount() == 0) {
        $db->exec("
            ALTER TABLE emergencias 
            ADD COLUMN historial_estados JSON NULL COMMENT 'Historial de cambios de estado con timestamps'
        ");
        echo "✅ Columna 'historial_estados' agregada\n\n";
    } else {
        echo "ℹ️  Columna 'historial_estados' ya existe\n\n";
    }

    // Actualizar estados existentes
    echo "📝 Migrando estados antiguos...\n";
    $db->exec("UPDATE emergencias SET estado = 'en_hospital' WHERE estado = 'atendido'");
    echo "✅ Estados migrados\n\n";

    // Crear tabla de historial
    echo "📝 Creando tabla de historial...\n";
    $db->exec("
        CREATE TABLE IF NOT EXISTS emergencias_estados_historial (
            id INT AUTO_INCREMENT PRIMARY KEY,
            emergencia_id INT NOT NULL,
            estado_anterior VARCHAR(50),
            estado_nuevo VARCHAR(50) NOT NULL,
            usuario_id INT NOT NULL,
            observaciones TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (emergencia_id) REFERENCES emergencias(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT,
            INDEX idx_emergencia (emergencia_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ Tabla 'emergencias_estados_historial' creada\n\n";

    // Verificar
    $stmt = $db->query("
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'emergencias' 
          AND COLUMN_NAME = 'estado'
    ");
    $columnType = $stmt->fetch()['COLUMN_TYPE'];

    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE                 ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";

    echo "📊 ESTADOS DISPONIBLES:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "  1️⃣  en_camino     - Ambulancia en camino al paciente\n";
    echo "  2️⃣  en_escena     - Ambulancia llegó al lugar\n";
    echo "  3️⃣  en_traslado   - Paciente siendo trasladado\n";
    echo "  4️⃣  en_hospital   - Paciente llegó al hospital\n";
    echo "  5️⃣  en_atencion   - Paciente siendo atendido\n";
    echo "  6️⃣  estabilizado  - Paciente estable\n";
    echo "  7️⃣  dado_alta     - Paciente dado de alta\n";
    echo "  8️⃣  cerrado       - Caso cerrado\n\n";

    echo "💾 Tipo de columna: {$columnType}\n\n";

} catch (PDOException $e) {
    die("❌ Error de base de datos: " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}






