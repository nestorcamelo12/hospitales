-- ============================================================================
-- BASE DE DATOS UNIPAZ V1 - SCHEMA COMPLETO
-- ============================================================================
-- Ejecutar en MySQL (phpMyAdmin o CLI)
-- Este script es seguro para re-ejecutar (usa IF NOT EXISTS)

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS hospitales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hospitales;

-- ============================================================================
-- TABLAS BÁSICAS (Si no existen ya)
-- ============================================================================

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Hospitales
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Usuarios
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'create, update, delete, login',
  entity VARCHAR(50) NULL COMMENT 'user, patient, hospital',
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLAS NUEVAS PARA UNIPAZ V1
-- ============================================================================

-- Tabla de Pacientes
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Historiales Médicos
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Emergencias
CREATE TABLE IF NOT EXISTS emergencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  signos_vitales JSON NOT NULL COMMENT '{"pa":"120/80","pulso":80,"spo2":98,"temp":36.6}',
  unidad VARCHAR(50) NOT NULL COMMENT 'Ej: AMB-23',
  descripcion TEXT NOT NULL,
  ubicacion VARCHAR(255) NULL,
  geo_lat DECIMAL(10, 8) NULL,
  geo_long DECIMAL(11, 8) NULL,
  estado ENUM('en_traslado', 'atendido', 'cerrado') DEFAULT 'en_traslado',
  hospital_destino_id INT NULL,
  registrado_por INT NOT NULL COMMENT 'User ID del paramédico',
  atendido_por INT NULL COMMENT 'User ID del médico',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Signos Vitales (Monitoreo)
CREATE TABLE IF NOT EXISTS vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  emergencia_id INT NULL COMMENT 'Si viene de una emergencia',
  fecha DATETIME NOT NULL,
  tipo VARCHAR(20) NOT NULL COMMENT 'HR, BP, SPO2, TEMP, GLUCOSE, etc',
  valor VARCHAR(50) NOT NULL COMMENT 'Valor como string para flexibilidad (120/80, 98%, 36.5°C)',
  unidad VARCHAR(20) NULL COMMENT 'mmHg, %, °C, bpm',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Notificaciones/Alertas
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'Usuario que recibe la notificación',
  tipo VARCHAR(50) NOT NULL COMMENT 'emergencia, alerta_vital, recordatorio',
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  entity_type VARCHAR(50) NULL COMMENT 'emergencia, patient, vital',
  entity_id INT NULL COMMENT 'ID de la entidad relacionada',
  leida TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_leida (leida),
  INDEX idx_tipo (tipo),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS INICIALES (SEEDS)
-- ============================================================================

-- Roles básicos
INSERT IGNORE INTO roles (id, name, description) VALUES
(1, 'administrador', 'Administrador del sistema con acceso completo'),
(2, 'medico', 'Personal médico con acceso a pacientes y emergencias'),
(3, 'ambulancia', 'Personal de ambulancia para registro de emergencias');

-- Hospital de ejemplo
INSERT IGNORE INTO hospitals (id, name, address, phone) VALUES
(1, 'Hospital Central UNIPAZ', 'Calle 100 #15-20', '+57 (1) 234-5678');

-- Usuario administrador (password: Admin123!)
-- La contraseña debe ser hasheada usando password_hash() en PHP
-- Este es solo un ejemplo, debes ejecutar el script create_admin.php

-- Pacientes de ejemplo
INSERT IGNORE INTO patients (id, nombre, documento, fecha_nac, edad, tipo_sangre, alergias, contacto_emergencia, hospital_id, created_by) VALUES
(1, 'María González', '1098765432', '1985-03-15', 39, 'O+', '["Penicilina", "Polen"]', 'Juan González - 3001234567', 1, 1),
(2, 'José Rodríguez', '80543210', '1960-07-22', 64, 'A-', '[]', 'Ana Rodríguez - 3009876543', 1, 1),
(3, 'Carlos Méndez', '1123456789', '1992-11-08', 32, 'B+', '["Lactosa"]', 'Lucía Méndez - 3005555555', 1, 1);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de pacientes con información completa
DROP VIEW IF EXISTS v_patients_full;
CREATE VIEW v_patients_full AS
SELECT 
    p.*,
    h.name as hospital_name,
    h.address as hospital_address,
    h.phone as hospital_phone,
    u.name as created_by_name,
    (SELECT COUNT(*) FROM emergencias WHERE paciente_id = p.id AND estado = 'en_traslado') as emergencias_activas,
    (SELECT COUNT(*) FROM medical_records WHERE paciente_id = p.id) as total_historiales,
    (SELECT COUNT(*) FROM emergencias WHERE paciente_id = p.id) as total_emergencias,
    (SELECT MAX(fecha) FROM medical_records WHERE paciente_id = p.id) as ultima_consulta
FROM patients p
LEFT JOIN hospitals h ON p.hospital_id = h.id
LEFT JOIN users u ON p.created_by = u.id;

-- Vista de emergencias con detalles completos
DROP VIEW IF EXISTS v_emergencias_full;
CREATE VIEW v_emergencias_full AS
SELECT 
    e.*,
    p.nombre as paciente_nombre,
    p.documento as paciente_documento,
    p.tipo_sangre as paciente_tipo_sangre,
    p.alergias as paciente_alergias,
    h.name as hospital_nombre,
    u.name as paramedico_nombre,
    u.email as paramedico_email,
    m.name as medico_nombre,
    m.email as medico_email
FROM emergencias e
INNER JOIN patients p ON e.paciente_id = p.id
LEFT JOIN hospitals h ON e.hospital_destino_id = h.id
INNER JOIN users u ON e.registrado_por = u.id
LEFT JOIN users m ON e.atendido_por = m.id;

-- ============================================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- ============================================================================

-- Trigger para auditoría de pacientes
DROP TRIGGER IF EXISTS tr_patients_insert_audit;
DELIMITER //
CREATE TRIGGER tr_patients_insert_audit
AFTER INSERT ON patients
FOR EACH ROW
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
        VALUES (NEW.created_by, 'create', 'patient', NEW.id, 
                JSON_OBJECT('nombre', NEW.nombre, 'documento', NEW.documento));
    END IF;
END//
DELIMITER ;

-- Trigger para auditoría de emergencias
DROP TRIGGER IF EXISTS tr_emergencias_insert_audit;
DELIMITER //
CREATE TRIGGER tr_emergencias_insert_audit
AFTER INSERT ON emergencias
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
    VALUES (NEW.registrado_por, 'create', 'emergencia', NEW.id, 
            JSON_OBJECT('paciente_id', NEW.paciente_id, 'unidad', NEW.unidad));
END//
DELIMITER ;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '✅ Schema completo creado exitosamente' as Status;

SELECT 
    'Tablas Principales' as Categoria,
    COUNT(*) as Total
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'hospitales' 
AND TABLE_NAME IN ('roles', 'hospitals', 'users', 'audit_logs', 'patients', 'medical_records', 'emergencias', 'vitals', 'notifications')

UNION ALL

SELECT 
    'Vistas' as Categoria,
    COUNT(*) as Total
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'hospitales'

UNION ALL

SELECT 
    'Triggers' as Categoria,
    COUNT(*) as Total
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'hospitales';

-- ============================================================================
-- INSTRUCCIONES POST-INSTALACIÓN
-- ============================================================================
-- 
-- 1. Crear usuario administrador:
--    php scripts/create_admin.php
--
-- 2. Verificar que el backend esté ejecutándose:
--    php -S localhost:8000 -t public
--
-- 3. Iniciar el frontend:
--    npm run dev
--
-- 4. Acceder al sistema:
--    http://localhost:5173
--    Usuario: admin@unipaz.local
--    Contraseña: Admin123!
--
-- ============================================================================
