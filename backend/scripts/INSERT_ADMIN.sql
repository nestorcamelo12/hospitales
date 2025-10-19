-- ============================================================================
-- INSERTAR USUARIO ADMINISTRADOR EN LA BASE DE DATOS
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta primero el script generar_hash_password.php para obtener un hash:
--    C:\xampp\php\php.exe backend\scripts\generar_hash_password.php
--
-- 2. Copia el hash generado
--
-- 3. Reemplaza 'TU_HASH_AQUI' en la línea 23 con el hash copiado
--
-- 4. Ejecuta este script SQL en phpMyAdmin o MySQL CLI
--
-- O SIMPLEMENTE EJECUTA:
--    C:\xampp\php\php.exe backend\scripts\create_admin.php
--
-- ============================================================================

USE hospitales;

-- Asegurar que existen los datos base
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'administrador', 'Administrador del sistema con acceso completo');

INSERT IGNORE INTO hospitals (id, name, address, phone) VALUES
(1, 'Hospital Central UNIPAZ', 'Calle 100 #15-20', '+57 (1) 234-5678');

-- Insertar usuario administrador
-- REEMPLAZA 'TU_HASH_AQUI' con el hash generado por generar_hash_password.php
INSERT INTO users (name, email, password, role_id, hospital_id, is_active)
SELECT 'Administrador UNIPAZ', 'admin@unipaz.local', 'TU_HASH_AQUI', 1, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@unipaz.local');

-- Verificar
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Usuario administrador creado'
        ELSE '❌ Error: No se creó el usuario'
    END as resultado
FROM users WHERE email = 'admin@unipaz.local';

-- ============================================================================
-- ALTERNATIVA: SQL CON HASH PRE-GENERADO (puede no funcionar en todos los casos)
-- ============================================================================
-- Si prefieres no generar el hash, puedes usar este SQL alternativo:
-- 
-- DELETE FROM users WHERE email = 'admin@unipaz.local';
-- 
-- INSERT INTO users (name, email, password, role_id, hospital_id, is_active) VALUES
-- ('Administrador UNIPAZ', 'admin@unipaz.local', 
--  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
--  1, 1, 1);
--
-- Contraseña: Admin123!
-- 
-- IMPORTANTE: Este hash es de ejemplo y DEBE ser regenerado con PHP
-- para garantizar que funcione correctamente.
--
-- ============================================================================



