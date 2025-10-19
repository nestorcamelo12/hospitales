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



