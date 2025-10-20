-- Crear tabla de notificaciones
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






