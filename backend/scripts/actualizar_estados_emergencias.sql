-- Script para actualizar los estados de emergencias
-- Ejecutar en phpMyAdmin o MySQL CLI

USE hospitales;

-- Modificar la columna estado para incluir más opciones
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
) DEFAULT 'en_camino';

-- Agregar columna para historial de estados (opcional)
ALTER TABLE emergencias 
ADD COLUMN historial_estados JSON NULL COMMENT 'Historial de cambios de estado con timestamps';

-- Actualizar estados existentes al nuevo formato
UPDATE emergencias 
SET estado = 'en_hospital' 
WHERE estado = 'atendido';

-- Crear tabla para historial de estados (más robusto que JSON)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar cambios
SELECT 'Estados de emergencias actualizados exitosamente' as status;

SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hospitales' 
  AND TABLE_NAME = 'emergencias' 
  AND COLUMN_NAME = 'estado';






