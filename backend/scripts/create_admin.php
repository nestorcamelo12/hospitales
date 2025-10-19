<?php
/**
 * Script para crear el usuario administrador inicial
 * Ejecutar: php backend/scripts/create_admin.php
 */

// Cargar configuración
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    die("Error: Archivo .env no encontrado. Copia env.example.txt a .env y configúralo.\n");
}

$env = parse_ini_file($envFile);

try {
    // Conexión a la base de datos
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

    // Datos del administrador
    $name = 'Administrador UNIPAZ';
    $email = 'admin@unipaz.local';
    $password = password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12]);
    $role_id = 1; // admin
    $hospital_id = 1; // Hospital Central UNIPAZ

    // Verificar si ya existe
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    
    if ($stmt->fetch()) {
        echo "⚠️  El usuario admin ya existe en la base de datos.\n";
        echo "   Email: {$email}\n";
        echo "   Si olvidaste la contraseña, elimina el registro y vuelve a ejecutar este script.\n";
        exit(0);
    }

    // Crear usuario admin
    $stmt = $db->prepare("
        INSERT INTO users (name, email, password, role_id, hospital_id, is_active) 
        VALUES (:name, :email, :password, :role, :hospital, 1)
    ");
    
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password' => $password,
        ':role' => $role_id,
        ':hospital' => $hospital_id
    ]);

    echo "✅ Usuario administrador creado exitosamente!\n\n";
    echo "   Credenciales:\n";
    echo "   Email:    {$email}\n";
    echo "   Password: Admin123!\n\n";
    echo "   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login.\n";

} catch (PDOException $e) {
    echo "❌ Error al crear el usuario administrador:\n";
    echo "   " . $e->getMessage() . "\n";
    exit(1);
}


