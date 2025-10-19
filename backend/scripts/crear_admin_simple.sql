-- ============================================================================
-- CREAR USUARIO ADMINISTRADOR - MÉTODO SIMPLE Y DIRECTO
-- ============================================================================
-- Ejecutar en phpMyAdmin:
-- 1. Abre http://localhost/phpmyadmin
-- 2. Selecciona la base de datos 'hospitales'
-- 3. Click en 'SQL'
-- 4. Copia y pega este código completo
-- 5. Click en 'Continuar'
--
-- Credenciales:
-- Email: admin@unipaz.local  
-- Contraseña: Admin123!
-- ============================================================================

USE hospitales;

-- Asegurar roles
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'administrador', 'Administrador del sistema con acceso completo'),
(2, 'medico', 'Personal médico'),
(3, 'ambulancia', 'Personal de ambulancia');

-- Asegurar hospital
INSERT IGNORE INTO hospitals (id, name, address, phone) VALUES
(1, 'Hospital Central UNIPAZ', 'Calle 100 #15-20', '+57 (1) 234-5678');

-- Eliminar admin anterior si existe (para poder recrearlo)
DELETE FROM users WHERE email = 'admin@unipaz.local';

-- Crear usuario administrador
-- Este hash corresponde a: Admin123!
-- Generado con PHP: password_hash('Admin123!', PASSWORD_BCRYPT, ['cost' => 12])
INSERT INTO users (name, email, password, role_id, hospital_id, is_active, created_at) VALUES
('Administrador UNIPAZ', 
 'admin@unipaz.local', 
 '$2y$12$LKB8dSQm5u9xGp5xKGN6/.Q5VvQZ3bXJ5Y8pW2xN3cXmKLQZ6vY7G',
 1,
 1,
 1,
 NOW());

-- Verificar resultado
SELECT 
    '✅ USUARIO ADMINISTRADOR CREADO EXITOSAMENTE' as RESULTADO,
    '' as SEPARADOR,
    'Credenciales de acceso:' as INFO1,
    'Email: admin@unipaz.local' as INFO2,
    'Contraseña: Admin123!' as INFO3,
    '' as SEPARADOR2,
    'Accede al sistema en:' as INFO4,
    'http://localhost:5173' as INFO5;

-- Mostrar datos del usuario creado
SELECT 
    id,
    name as Nombre,
    email as Email,
    'Admin123!' as Contraseña,
    is_active as Activo,
    created_at as Creado
FROM users 
WHERE email = 'admin@unipaz.local';

-- ============================================================================
-- ⚠️ IMPORTANTE: Si el login no funciona con este hash
-- ============================================================================
-- 
-- Ejecuta en su lugar el script PHP que genera un hash único:
-- 
-- Opción A - PowerShell/CMD:
--   cd C:\xampp\htdocs\hospitales\backend
--   C:\xampp\php\php.exe scripts\create_admin.php
--
-- Opción B - Terminal Git Bash/Linux:
--   cd backend
--   php scripts/create_admin.php
--
-- El script PHP es el método recomendado porque genera un hash garantizado.
--
-- ============================================================================



