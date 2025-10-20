<?php
/**
 * Script para generar hash de contraseña
 * Uso: php scripts/generar_hash_password.php
 */

$password = 'Admin123!';
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

echo "============================================\n";
echo "  GENERADOR DE HASH DE CONTRASEÑA\n";
echo "============================================\n\n";
echo "Contraseña: {$password}\n";
echo "Hash generado:\n\n";
echo "{$hash}\n\n";
echo "============================================\n";
echo "Copia este hash y úsalo en el SQL:\n\n";
echo "INSERT INTO users (name, email, password, role_id, hospital_id, is_active)\n";
echo "VALUES (\n";
echo "  'Administrador UNIPAZ',\n";
echo "  'admin@unipaz.local',\n";
echo "  '{$hash}',\n";
echo "  1,\n";
echo "  1,\n";
echo "  1\n";
echo ");\n\n";
echo "============================================\n";
echo "O ejecuta directamente create_admin.php\n";
echo "============================================\n";






