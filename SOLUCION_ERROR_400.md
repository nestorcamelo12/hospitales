# 🔧 Solución al Error 400 en Dashboard

**Fecha:** 20 de octubre de 2025  
**Estado:** ✅ RESUELTO

## 🔍 Problema Identificado

El sistema presentaba un error 400 (Bad Request) al intentar acceder al endpoint `/api/reports/dashboard`. El error específico era:

```
{"error":"El campo 'email' es requerido"}
```

Este error aparecía incluso con endpoints que no deberían requerir validación de email.

## 🎯 Causa Raíz

El archivo `backend/api/auth.php` contenía **código que se ejecutaba automáticamente al ser importado** (no estaba dentro de una función). Esto causaba que:

1. Cada vez que `index.php` importaba `auth.php`, se ejecutaba la lógica de login
2. La validación de email/password se ejecutaba para TODOS los endpoints
3. Cualquier petición que no fuera un login fallaba con error 400

### Código Problemático

```php
<?php
// backend/api/auth.php (versión incorrecta)

use App\Db;
use App\Helpers;

$db = Db::getInstance();
$input = Helpers::getJsonInput();

// Este código se ejecutaba al importar el archivo
$error = Helpers::validateRequired($input, ['email', 'password']);
if ($error) {
    Helpers::errorResponse($error, 400); // ❌ Error para todos los endpoints
}
// ... más código de login
```

## ✅ Solución Aplicada

### 1. Archivo .env Faltante

**Problema:** El archivo `.env` no existía, solo `env.example.txt`  
**Solución:** Copiar y configurar el archivo .env

```bash
# En backend/
cp env.example.txt .env
```

**Configuración aplicada:**
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hospitales
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=TU_SECRETO_MUY_SEGUR0_CAMBIA_ESTO_EN_PRODUCCION
JWT_EXPIRATION=28800

CORS_ORIGIN=http://localhost:8080
```

### 2. Base de Datos

**Ejecutado:** Script de configuración completa

```bash
cd backend
php scripts/setup_completo.php
```

**Resultado:**
- ✓ Base de datos `hospitales` creada
- ✓ 10 tablas creadas
- ✓ 3 roles insertados
- ✓ 3 hospitales insertados
- ✓ 3 usuarios creados (admin, médico, ambulancia)
- ✓ 4 pacientes demo
- ✓ Datos de prueba completos

### 3. Corrección del archivo auth.php

**Cambio principal:** Encapsular todo el código en una función

```php
<?php
// backend/api/auth.php (versión corregida)

use App\Db;
use App\Helpers;
use Firebase\JWT\JWT;

// POST /api/auth/login - Iniciar sesión
function handleLogin(): void  // ✅ Ahora es una función
{
    $db = Db::getInstance();
    $input = Helpers::getJsonInput();

    // Validar campos requeridos
    $error = Helpers::validateRequired($input, ['email', 'password']);
    if ($error) {
        Helpers::errorResponse($error, 400);
    }

    // ... resto de la lógica de login
}
```

### 4. Actualización de index.php

**Cambio:** Usar la nueva función en lugar del código inline

```php
// backend/public/index.php

// Antes (no funcionaba porque auth.php se auto-ejecutaba)
if ($requestUri === '/auth/login' && $requestMethod === 'POST') {
    // El código ya se había ejecutado al importar auth.php
}

// Después (correcto)
if ($requestUri === '/auth/login' && $requestMethod === 'POST') {
    handleLogin(); // ✅ Llamada explícita a la función
}
```

### 5. Restauración de reports.php

El archivo `backend/api/reports.php` se restauró con la función completa que obtiene datos reales de la base de datos:

- Total de pacientes
- Emergencias activas y de hoy
- Consultas de la semana
- Pacientes críticos
- Últimas emergencias
- Alertas críticas
- Pacientes recientes con signos vitales

## 🚀 Estado Actual

### Servidores Activos

```
✓ Backend:  http://localhost:8000  (PHP Built-in Server)
✓ Frontend: http://localhost:8080  (Vite Dev Server)
```

### Credenciales de Acceso

| Rol | Email | Password |
|-----|-------|----------|
| **Administrador** | admin@unipaz.local | Admin123! |
| Médico | medico@unipaz.local | Medico123! |
| Ambulancia | ambulancia@unipaz.local | Ambulancia123! |

### Endpoints Verificados

✅ `POST /api/auth/login` - Autenticación funcionando  
✅ `GET /api/reports/dashboard` - Dashboard con datos reales  
✅ `GET /api/patients` - Listado de pacientes  
✅ `GET /api/emergencias` - Gestión de emergencias  

### Datos del Sistema

```
• Pacientes en sistema: 4
• Emergencias activas: 0
• Emergencias de hoy: 0
• Consultas esta semana: 0
• Pacientes críticos: 0
```

## 📋 Lecciones Aprendidas

### ❌ Errores a Evitar

1. **No ejecutar código al importar archivos PHP**
   - Los archivos de API deben contener solo definiciones de funciones
   - El código ejecutable debe estar dentro de funciones

2. **No olvidar crear el archivo .env**
   - Siempre verificar que `.env` exista después de clonar
   - Copiar desde `env.example.txt` y ajustar configuración

3. **Debugging de errores "Unexpected token '<'"**
   - Este error indica que PHP está devolviendo HTML (error) en lugar de JSON
   - Revisar logs de PHP y errores de base de datos

### ✅ Buenas Prácticas Aplicadas

1. **Arquitectura de archivos de API:**
   ```php
   <?php
   // Importaciones
   use App\Db;
   use App\Helpers;

   // Funciones (no código ejecutable)
   function handleCreate(): void { ... }
   function handleRead(): void { ... }
   function handleUpdate(): void { ... }
   function handleDelete(): void { ... }
   ```

2. **Routing centralizado:**
   ```php
   // index.php
   if ($requestUri === '/endpoint' && $requestMethod === 'POST') {
       handleEndpoint(); // Llamada explícita
   }
   ```

3. **Separación de configuración:**
   - Variables de entorno en `.env`
   - Scripts de setup automáticos
   - Datos demo separados de datos de producción

## 🔄 Comandos de Inicio Rápido

### Para iniciar todo el sistema:

```powershell
# Terminal 1 - Backend
cd C:\xampp\htdocs\hospitales\backend
php -S localhost:8000 -t public

# Terminal 2 - Frontend
cd C:\xampp\htdocs\hospitales
npm run dev
```

### Para verificar el estado:

```powershell
# Probar login
$login = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -Body '{"email":"admin@unipaz.local","password":"Admin123!"}' `
    -ContentType "application/json"

# Probar dashboard
$dashboard = Invoke-RestMethod -Uri "http://localhost:8000/api/reports/dashboard" `
    -Headers @{"Authorization"="Bearer $($login.token)"}

Write-Host "Pacientes: $($dashboard.data.totales.pacientes)"
```

## 📞 Soporte

Si el error vuelve a ocurrir:

1. **Verificar que .env existe:**
   ```powershell
   Test-Path C:\xampp\htdocs\hospitales\backend\.env
   ```

2. **Revisar que la BD esté activa:**
   ```powershell
   # Abrir phpMyAdmin
   Start-Process "http://localhost/phpmyadmin"
   ```

3. **Reiniciar servidores:**
   ```powershell
   # Matar procesos PHP
   Get-Process php | Stop-Process -Force
   
   # Reiniciar backend
   cd C:\xampp\htdocs\hospitales\backend
   php -S localhost:8000 -t public
   ```

---

**Documentado por:** AI Assistant  
**Última actualización:** 20 de octubre de 2025, 23:45  
**Estado:** ✅ Sistema completamente funcional


