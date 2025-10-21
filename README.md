Información del proyecto

URL: https://lovable.dev/projects/ed6f8a2f-380d-415e-b659-9663eccd3a46

¿Cómo puedo editar este código?

Hay varias formas de editar tu aplicación.

Usar Lovable

Simplemente visita el Proyecto Lovable y comienza a dar instrucciones.

Los cambios realizados a través de Lovable se guardarán automáticamente en este repositorio.

Usar tu IDE preferido

Si prefieres trabajar localmente usando tu propio IDE, puedes clonar este repositorio y subir los cambios. Los cambios que subas también se reflejarán en Lovable.

El único requisito es tener instalados Node.js y npm – instálalos con nvm

Sigue estos pasos:

# Paso 1: Clona el repositorio usando la URL Git del proyecto.
git clone <TU_GIT_URL>

# Paso 2: Navega al directorio del proyecto.
cd <NOMBRE_DE_TU_PROYECTO>

# Paso 3: Instala las dependencias necesarias.
npm i

# Paso 4: Inicia el servidor de desarrollo con recarga automática y vista previa instantánea.
npm run dev


Editar un archivo directamente en GitHub

Navega al archivo o archivos que desees modificar.

Haz clic en el botón "Edit" (icono de lápiz) en la parte superior derecha de la vista del archivo.

Realiza tus cambios y confirma (commit) las modificaciones.

Usar GitHub Codespaces

Ve a la página principal de tu repositorio.

Haz clic en el botón "Code" (botón verde) cerca de la parte superior derecha.

Selecciona la pestaña "Codespaces".

Haz clic en "New codespace" para iniciar un nuevo entorno de Codespace.

Edita los archivos directamente en el Codespace y luego realiza commit y push de tus cambios cuando termines.

¿Qué tecnologías se usan en este proyecto?

Este proyecto está construido con:

Vite

TypeScript

React

shadcn-ui

Tailwind CSS

¿Cómo puedo desplegar este proyecto?

Simplemente abre Lovable y haz clic en Share -> Publish.

¿Puedo conectar un dominio personalizado a mi proyecto Lovable?

¡Sí, puedes hacerlo!

Para conectar un dominio, ve a Project > Settings > Domains y haz clic en Connect Domain.

# 🚀 Instalación Rápida - UNIPAZ Admin Panel

## Pasos Rápidos (10 minutos)

### 1️⃣ Base de Datos
```bash
# 1. Abre XAMPP y arranca Apache + MySQL
# 2. Abre phpMyAdmin: http://localhost/phpmyadmin
# 3. Importa: backend/scripts/db_schema.sql
```

### 2️⃣ Backend PHP
```bash
cd backend
composer install
copy env.example.txt .env
# Edita .env con tus credenciales de MySQL
php scripts/create_admin.php
php -S localhost:8000 -t public
```

### 3️⃣ Frontend React
```bash
# Nueva terminal, desde la raíz
npm install
copy env.local.example .env.local
npm run dev
```

### 4️⃣ Acceder
```
Frontend: http://localhost:5173
Backend:  http://localhost:8000

Credenciales:
Email:    admin@unipaz.local
Password: Admin123!
```

## ✅ Verificación

- [ ] MySQL corriendo en XAMPP
- [ ] Backend en puerto 8000
- [ ] Frontend en puerto 5173
- [ ] Login exitoso con admin@unipaz.local
- [ ] Puedes ver y crear usuarios
- [ ] Puedes ver y crear hospitales

## ❌ Problemas Comunes

**No conecta a la BD**
```bash
# Verifica en backend/.env:
DB_HOST=127.0.0.1
DB_DATABASE=hospitales
DB_USERNAME=root
DB_PASSWORD=           # vacío por defecto en XAMPP
```

**CORS Error**
```bash
# En backend/.env debe ser:
CORS_ORIGIN=http://localhost:5173
```

**Token expirado**
- Cierra sesión y vuelve a entrar

## 📚 Documentación Completa

Ver `README.md` para documentación detallada de la API y arquitectura.

---

¡Listo! 🎉 Ya puedes administrar usuarios y hospitales de UNIPAZ.
