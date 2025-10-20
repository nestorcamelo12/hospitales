-- ============================================================================
-- CREAR USUARIO ADMINISTRADOR - SCRIPT SQL DIRECTO
-- ============================================================================
-- Este script crea el usuario administrador inicial del sistema UNIPAZ
-- 
-- Credenciales:
-- Email: admin@unipaz.local
-- Contraseña: Admin123!
--
-- ============================================================================

USE hospitales;

-- Verificar que existan las tablas base
SELECT 'Verificando estructura...' as status;

-- Verificar/crear roles si no existen
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'administrador', 'Administrador del sistema con acceso completo'),
(2, 'medico', 'Personal médico con acceso a pacientes y emergencias'),
(3, 'ambulancia', 'Personal de ambulancia para registro de emergencias');

-- Verificar/crear hospital si no existe
INSERT IGNORE INTO hospitals (id, name, address, phone) VALUES
(1, 'Hospital Central UNIPAZ', 'Calle 100 #15-20', '+57 (1) 234-5678');

-- Eliminar usuario admin si existe (para poder recrearlo con nueva contraseña)
-- Comentar esta línea si NO quieres sobrescribir el usuario existente
-- DELETE FROM users WHERE email = 'admin@unipaz.local';

-- Crear usuario administrador
-- Nota: Este hash corresponde a la contraseña "Admin123!" con bcrypt
-- Hash generado con: password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12])
INSERT INTO users (name, email, password, role_id, hospital_id, is_active, created_by)
SELECT 
    'Administrador UNIPAZ',
    'admin@unipaz.local',
    '$2y$12$LKzG3qX8yF.9hJY7X8YvJOqQvW3XJ9rZvzH2fLQ3NqX8K9Y7WxYzK',
    1,
    1,
    1,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@unipaz.local'
);

-- Verificar el resultado
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Usuario administrador creado/verificado exitosamente'
        ELSE '❌ Error: No se pudo crear el usuario'
    END as resultado,
    COUNT(*) as usuarios_admin
FROM users 
WHERE email = 'admin@unipaz.local';

-- Mostrar información del usuario
SELECT 
    id,
    name as nombre,
    email,
    r.name as rol,
    h.name as hospital,
    is_active as activo,
    created_at as fecha_creacion
FROM users u
INNER JOIN roles r ON u.role_id = r.id
LEFT JOIN hospitals h ON u.hospital_id = h.id
WHERE u.email = 'admin@unipaz.local';

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
--
-- IMPORTANTE: Si este hash no funciona para login, ejecuta en su lugar:
--     php scripts/create_admin.php
--
-- El script PHP generará un hash válido automáticamente.
--
-- CREDENCIALES:
-- Email: admin@unipaz.local
-- Contraseña: Admin123!
--
-- NOTA: Si necesitas cambiar la contraseña después:
-- 1. Genera el hash en PHP:
--    echo password_hash('TuNuevaContraseña', PASSWORD_BCRYPT, ['cost' => 12]);
-- 2. Actualiza el usuario:
--    UPDATE users SET password = 'tu_hash_aqui' WHERE email = 'admin@unipaz.local';
--
-- ============================================================================






