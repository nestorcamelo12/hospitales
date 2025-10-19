<?php
/**
 * ============================================================================
 * SCRIPT DE INSTALACIÓN COMPLETA - UNIPAZ V1
 * ============================================================================
 * 
 * Este script hace TODO de una vez:
 * - Crea todas las tablas de la base de datos
 * - Inserta datos demo (pacientes, emergencias, etc.)
 * - Crea el usuario administrador
 * 
 * Uso: php scripts/setup_completo.php
 * 
 * ============================================================================
 */

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                                                            ║\n";
echo "║     UNIPAZ V1 - INSTALACIÓN COMPLETA                      ║\n";
echo "║                                                            ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Cargar configuración
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    die("❌ Error: Archivo .env no encontrado.\n   Copia env.example.txt a .env y configúralo.\n\n");
}

$env = parse_ini_file($envFile);

try {
    echo "📡 Conectando a la base de datos...\n";
    
    // Conexión a la base de datos
    $dsn = sprintf(
        'mysql:host=%s;port=%s;charset=utf8mb4',
        $env['DB_HOST'] ?? '127.0.0.1',
        $env['DB_PORT'] ?? '3306'
    );
    
    $db = new PDO(
        $dsn,
        $env['DB_USER'] ?? 'root',
        $env['DB_PASSWORD'] ?? '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    $dbName = $env['DB_NAME'] ?? 'hospitales';
    
    echo "✅ Conexión exitosa\n\n";
    
    // ========================================================================
    // PASO 1: CREAR BASE DE DATOS
    // ========================================================================
    echo "🔨 Paso 1/5: Creando base de datos '$dbName'...\n";
    
    $db->exec("CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("USE $dbName");
    
    echo "✅ Base de datos lista\n\n";
    
    // ========================================================================
    // PASO 2: CREAR TABLAS
    // ========================================================================
    echo "🔨 Paso 2/5: Creando tablas...\n";
    
    // Tabla roles
    $db->exec("
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'roles'\n";
    
    // Tabla hospitals
    $db->exec("
        CREATE TABLE IF NOT EXISTS hospitals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          address VARCHAR(255),
          phone VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'hospitals'\n";
    
    // Tabla users
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role_id INT NOT NULL,
          hospital_id INT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
          created_by INT NULL,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
          FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_email (email),
          INDEX idx_role (role_id),
          INDEX idx_hospital (hospital_id),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'users'\n";
    
    // Tabla audit_logs
    $db->exec("
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          action VARCHAR(50) NOT NULL,
          entity VARCHAR(50) NULL,
          entity_id INT NULL,
          details JSON NULL,
          ip_address VARCHAR(45) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_user (user_id),
          INDEX idx_action (action),
          INDEX idx_entity (entity),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'audit_logs'\n";
    
    // Tabla patients
    $db->exec("
        CREATE TABLE IF NOT EXISTS patients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(150) NOT NULL,
          documento VARCHAR(50) NOT NULL UNIQUE,
          fecha_nac DATE NOT NULL,
          edad INT,
          tipo_sangre VARCHAR(10),
          alergias JSON NULL,
          contacto_emergencia VARCHAR(255),
          hospital_id INT NOT NULL,
          foto_url VARCHAR(255) NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
          created_by INT NULL,
          FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_documento (documento),
          INDEX idx_hospital (hospital_id),
          INDEX idx_nombre (nombre),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'patients'\n";
    
    // Tabla medical_records
    $db->exec("
        CREATE TABLE IF NOT EXISTS medical_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          paciente_id INT NOT NULL,
          fecha DATETIME NOT NULL,
          medico_id INT NOT NULL,
          diagnostico TEXT NOT NULL,
          tratamiento TEXT,
          medicamentos TEXT,
          observaciones TEXT,
          adjuntos JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (medico_id) REFERENCES users(id) ON DELETE RESTRICT,
          INDEX idx_paciente (paciente_id),
          INDEX idx_medico (medico_id),
          INDEX idx_fecha (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'medical_records'\n";
    
    // Tabla emergencias
    $db->exec("
        CREATE TABLE IF NOT EXISTS emergencias (
          id INT AUTO_INCREMENT PRIMARY KEY,
          paciente_id INT NOT NULL,
          fecha DATETIME NOT NULL,
          signos_vitales JSON NOT NULL,
          unidad VARCHAR(50) NOT NULL,
          descripcion TEXT NOT NULL,
          ubicacion VARCHAR(255) NULL,
          geo_lat DECIMAL(10, 8) NULL,
          geo_long DECIMAL(11, 8) NULL,
          estado ENUM('en_traslado', 'atendido', 'cerrado') DEFAULT 'en_traslado',
          hospital_destino_id INT NULL,
          registrado_por INT NOT NULL,
          atendido_por INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE RESTRICT,
          FOREIGN KEY (hospital_destino_id) REFERENCES hospitals(id) ON DELETE SET NULL,
          FOREIGN KEY (registrado_por) REFERENCES users(id) ON DELETE RESTRICT,
          FOREIGN KEY (atendido_por) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_paciente (paciente_id),
          INDEX idx_estado (estado),
          INDEX idx_fecha (fecha),
          INDEX idx_hospital (hospital_destino_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'emergencias'\n";
    
    // Tabla vitals
    $db->exec("
        CREATE TABLE IF NOT EXISTS vitals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          paciente_id INT NOT NULL,
          emergencia_id INT NULL,
          fecha DATETIME NOT NULL,
          tipo VARCHAR(20) NOT NULL,
          valor VARCHAR(50) NOT NULL,
          unidad VARCHAR(20) NULL,
          registrado_por INT NULL,
          notas TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (emergencia_id) REFERENCES emergencias(id) ON DELETE SET NULL,
          FOREIGN KEY (registrado_por) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_paciente (paciente_id),
          INDEX idx_emergencia (emergencia_id),
          INDEX idx_tipo (tipo),
          INDEX idx_fecha (fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'vitals'\n";
    
    // Tabla notifications
    $db->exec("
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          mensaje TEXT NOT NULL,
          entity_type VARCHAR(50) NULL,
          entity_id INT NULL,
          leida TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_leida (leida),
          INDEX idx_tipo (tipo),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "  ✓ Tabla 'notifications'\n";
    
    echo "✅ 9 tablas creadas exitosamente\n\n";
    
    // ========================================================================
    // PASO 3: INSERTAR DATOS BÁSICOS
    // ========================================================================
    echo "🔨 Paso 3/5: Insertando datos básicos...\n";
    
    // Roles
    $db->exec("
        INSERT IGNORE INTO roles (id, name, description) VALUES
        (1, 'administrador', 'Administrador del sistema con acceso completo'),
        (2, 'medico', 'Personal médico con acceso a pacientes y emergencias'),
        (3, 'ambulancia', 'Personal de ambulancia para registro de emergencias')
    ");
    echo "  ✓ Roles insertados\n";
    
    // Hospitales
    $db->exec("
        INSERT IGNORE INTO hospitals (id, name, address, phone) VALUES
        (1, 'Hospital Central UNIPAZ', 'Calle 100 #15-20', '+57 (1) 234-5678'),
        (2, 'Hospital Regional Norte', 'Carrera 7 #80-30', '+57 (1) 345-6789')
    ");
    echo "  ✓ Hospitales insertados\n";
    
    echo "✅ Datos básicos insertados\n\n";
    
    // ========================================================================
    // PASO 4: CREAR USUARIO ADMINISTRADOR
    // ========================================================================
    echo "🔨 Paso 4/5: Creando usuario administrador...\n";
    
    // Verificar si ya existe
    $stmt = $db->prepare("SELECT id FROM users WHERE email = 'admin@unipaz.local'");
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo "  ⚠️  El usuario admin ya existe, se omite la creación\n";
    } else {
        $adminPassword = password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12]);
        
        $stmt = $db->prepare("
            INSERT INTO users (name, email, password, role_id, hospital_id, is_active)
            VALUES (:name, :email, :password, :role, :hospital, 1)
        ");
        
        $stmt->execute([
            ':name' => 'Administrador UNIPAZ',
            ':email' => 'admin@unipaz.local',
            ':password' => $adminPassword,
            ':role' => 1,
            ':hospital' => 1
        ]);
        
        echo "  ✓ Usuario administrador creado\n";
    }
    
    // Crear usuarios demo adicionales
    $stmt = $db->prepare("SELECT id FROM users WHERE email = 'medico@unipaz.local'");
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        $medicoPassword = password_hash('Medico123!', PASSWORD_BCRYPT, ['cost' => 12]);
        $ambulanciaPassword = password_hash('Ambulancia123!', PASSWORD_BCRYPT, ['cost' => 12]);
        
        $db->prepare("
            INSERT INTO users (name, email, password, role_id, hospital_id, is_active) VALUES
            ('Dr. Juan Pérez', 'medico@unipaz.local', ?, 2, 1, 1)
        ")->execute([$medicoPassword]);
        
        $db->prepare("
            INSERT INTO users (name, email, password, role_id, hospital_id, is_active) VALUES
            ('Paramédico Pedro Gómez', 'ambulancia@unipaz.local', ?, 3, 1, 1)
        ")->execute([$ambulanciaPassword]);
        
        echo "  ✓ Usuarios demo creados (médico y ambulancia)\n";
    }
    
    echo "✅ Usuarios creados\n\n";
    
    // ========================================================================
    // PASO 5: INSERTAR DATOS DEMO
    // ========================================================================
    echo "🔨 Paso 5/5: Insertando datos demo (pacientes, emergencias, etc.)...\n";
    
    // Pacientes demo
    $db->exec("
        INSERT IGNORE INTO patients (id, nombre, documento, fecha_nac, edad, tipo_sangre, alergias, contacto_emergencia, hospital_id, created_by) VALUES
        (1, 'María González', '1098765432', '1985-03-15', 39, 'O+', '[\"Penicilina\", \"Polen\"]', 'Juan González - 3001234567', 1, 1),
        (2, 'José Rodríguez', '80543210', '1960-07-22', 64, 'A-', '[]', 'Ana Rodríguez - 3009876543', 1, 1),
        (3, 'Carlos Méndez', '1123456789', '1992-11-08', 32, 'B+', '[\"Lactosa\"]', 'Lucía Méndez - 3005555555', 1, 1),
        (4, 'Ana Martínez', '1234567890', '1990-05-20', 34, 'AB+', '[]', 'Luis Martínez - 3002223333', 1, 1)
    ");
    echo "  ✓ Pacientes demo insertados\n";
    
    // Historiales médicos demo (si existe el médico con ID 2)
    $stmt = $db->query("SELECT id FROM users WHERE role_id = 2 LIMIT 1");
    $medico = $stmt->fetch();
    $medicoId = $medico ? $medico['id'] : 1;
    
    $db->exec("
        INSERT IGNORE INTO medical_records (id, paciente_id, fecha, medico_id, diagnostico, tratamiento, medicamentos, observaciones) VALUES
        (1, 1, '2024-10-15 10:30:00', $medicoId, 'Hipertensión arterial leve', 'Control de presión arterial, dieta baja en sodio', 'Losartán 50mg cada 12h', 'Paciente refiere dolor de cabeza ocasional.'),
        (2, 2, '2024-09-20 14:15:00', $medicoId, 'Diabetes tipo 2 controlada', 'Manejo con insulina y dieta', 'Metformina 850mg cada 8h', 'Glucometrías dentro de rango objetivo.')
    ");
    echo "  ✓ Historiales médicos demo insertados\n";
    
    // Signos vitales demo
    $db->exec("
        INSERT IGNORE INTO vitals (paciente_id, fecha, tipo, valor, unidad, registrado_por) VALUES
        (1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'BP', '120/80', 'mmHg', $medicoId),
        (1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'HR', '75', 'bpm', $medicoId),
        (1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'SPO2', '98', '%', $medicoId),
        (2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'GLUCOSE', '110', 'mg/dL', $medicoId),
        (2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'BP', '130/85', 'mmHg', $medicoId)
    ");
    echo "  ✓ Signos vitales demo insertados\n";
    
    echo "✅ Datos demo insertados\n\n";
    
    // ========================================================================
    // RESUMEN FINAL
    // ========================================================================
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║                                                            ║\n";
    echo "║  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE                   ║\n";
    echo "║                                                            ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    
    echo "📊 RESUMEN:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Contar registros
    $stats = [
        'Tablas' => $db->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbName'")->fetchColumn(),
        'Roles' => $db->query("SELECT COUNT(*) FROM roles")->fetchColumn(),
        'Hospitales' => $db->query("SELECT COUNT(*) FROM hospitals")->fetchColumn(),
        'Usuarios' => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        'Pacientes' => $db->query("SELECT COUNT(*) FROM patients")->fetchColumn(),
        'Historiales Médicos' => $db->query("SELECT COUNT(*) FROM medical_records")->fetchColumn(),
        'Signos Vitales' => $db->query("SELECT COUNT(*) FROM vitals")->fetchColumn(),
    ];
    
    foreach ($stats as $item => $count) {
        echo sprintf("  %-20s : %d\n", $item, $count);
    }
    
    echo "\n";
    echo "👤 USUARIOS CREADOS:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    $users = $db->query("
        SELECT u.name, u.email, r.name as role 
        FROM users u 
        INNER JOIN roles r ON u.role_id = r.id
        ORDER BY u.id
    ")->fetchAll();
    
    foreach ($users as $user) {
        echo sprintf("  📧 %s\n", $user['email']);
        echo sprintf("     Nombre: %s\n", $user['name']);
        echo sprintf("     Rol: %s\n", ucfirst($user['role']));
        
        if (strpos($user['email'], 'admin') !== false) {
            echo "     🔑 Contraseña: Admin123!\n";
        } elseif (strpos($user['email'], 'medico') !== false) {
            echo "     🔑 Contraseña: Medico123!\n";
        } elseif (strpos($user['email'], 'ambulancia') !== false) {
            echo "     🔑 Contraseña: Ambulancia123!\n";
        }
        echo "\n";
    }
    
    echo "🚀 PRÓXIMOS PASOS:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "  1. Iniciar el backend:\n";
    echo "     php -S localhost:8000 -t public\n\n";
    echo "  2. Iniciar el frontend (en otra terminal):\n";
    echo "     npm run dev\n\n";
    echo "  3. Acceder al sistema:\n";
    echo "     http://localhost:5173\n\n";
    echo "  4. Login con las credenciales mostradas arriba\n\n";
    
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║         ¡Sistema UNIPAZ listo para usar! 🎉               ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n\n";
    
} catch (PDOException $e) {
    echo "\n❌ ERROR DE BASE DE DATOS:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo $e->getMessage() . "\n\n";
    echo "💡 SOLUCIONES COMUNES:\n";
    echo "  - Verifica que MySQL esté ejecutándose en XAMPP\n";
    echo "  - Verifica las credenciales en el archivo .env\n";
    echo "  - Verifica que el usuario tenga permisos para crear bases de datos\n\n";
    exit(1);
} catch (Exception $e) {
    echo "\n❌ ERROR:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo $e->getMessage() . "\n\n";
    exit(1);
}



