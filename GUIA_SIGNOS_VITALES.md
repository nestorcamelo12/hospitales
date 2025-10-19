# 📊 Guía: Actualización de Signos Vitales en Emergencias

## ✅ Funcionalidad Implementada

Has solicitado la capacidad de **actualizar signos vitales** desde la vista de detalles de emergencia y **llevar un registro histórico** de todos los cambios.

---

## 🎯 ¿Cómo Funciona?

### **1. Vista de Detalles de Emergencia**

Cuando accedes a los detalles de una emergencia (`/emergencias/:id`), verás:

#### **Tarjeta de Signos Vitales Actuales**
- 💓 **Presión Arterial** (PA)
- ❤️ **Frecuencia Cardíaca** (FC/Pulso)
- 💧 **Saturación de Oxígeno** (SpO2)
- 🌡️ **Temperatura**

Cada signo vital tiene:
- **Color indicativo**: Rojo para valores críticos, verde para normales
- **Icono representativo**: Corazón, actividad, gota, termómetro
- **Unidades claras**: mmHg, bpm, %, °C

#### **Botón "Actualizar"**
- Ubicado en la esquina superior derecha de la tarjeta
- Al hacer clic, abre un modal para ingresar nuevos valores

---

### **2. Modal de Actualización**

El modal incluye:

#### **Campos Disponibles:**
```
📊 Presión Arterial (PA)
   Formato: 120/80
   Unidad: mmHg

❤️ Frecuencia Cardíaca (FC)
   Formato: Número entero (ej: 80)
   Unidad: bpm (latidos por minuto)

💧 Saturación O2 (SpO2)
   Formato: Número del 0-100
   Unidad: % (porcentaje)

🌡️ Temperatura
   Formato: Decimal (ej: 36.5)
   Unidad: °C (Celsius)
```

#### **Comportamiento:**
- ✅ **Flexible**: Solo actualiza los campos que tengan valor
- ✅ **Pre-cargado**: Muestra los valores actuales como referencia
- ✅ **Validación**: No permite valores fuera de rango

---

### **3. Historial de Signos Vitales**

Después de actualizar, se crea una **nueva tarjeta automáticamente** que muestra:

#### **Información por Registro:**
- 📅 **Fecha y hora** del cambio
- 🏷️ **Tipo de vital**: BP, HR, SPO2, TEMP, GLUCOSE
- 📊 **Valor y unidad**: 120/80 mmHg, 80 bpm, 98%, etc.
- 💬 **Notas** (si se agregaron)

#### **Características:**
- Ordenado del más reciente al más antiguo
- Muestra los últimos **10 registros** por defecto
- Indica si hay más registros disponibles
- Colores e iconos diferenciados por tipo de vital

---

## 🔐 Permisos por Rol

### **Administrador (role_id = 1)**
✅ **Puede actualizar signos vitales en cualquier emergencia**

### **Médico (role_id = 2)**
✅ **Puede actualizar signos vitales** en emergencias de su hospital

### **Paramédico/Ambulancia (role_id = 3)**
✅ **Puede actualizar signos vitales** en emergencias activas

---

## 🗄️ Almacenamiento en Base de Datos

### **Tabla: `vitals`**

Cada actualización crea múltiples registros (uno por cada signo vital):

```sql
CREATE TABLE vitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  emergencia_id INT NULL,
  fecha DATETIME NOT NULL,
  tipo VARCHAR(20) NOT NULL,        -- 'BP', 'HR', 'SPO2', 'TEMP', etc.
  valor VARCHAR(50) NOT NULL,        -- '120/80', '80', '98', '36.5'
  unidad VARCHAR(20) NULL,           -- 'mmHg', 'bpm', '%', '°C'
  registrado_por INT NULL,           -- User ID
  notas TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (paciente_id) REFERENCES patients(id),
  FOREIGN KEY (emergencia_id) REFERENCES emergencias(id),
  FOREIGN KEY (registrado_por) REFERENCES users(id)
);
```

### **Ejemplo de Registro:**

Si actualizas 4 signos vitales a la vez, se crean 4 registros:

| id | tipo | valor | unidad | fecha | registrado_por |
|----|------|-------|--------|-------|----------------|
| 1  | BP   | 120/80 | mmHg  | 2024-10-19 10:30:00 | 2 |
| 2  | HR   | 80    | bpm   | 2024-10-19 10:30:00 | 2 |
| 3  | SPO2 | 98    | %     | 2024-10-19 10:30:00 | 2 |
| 4  | TEMP | 36.5  | °C    | 2024-10-19 10:30:00 | 2 |

---

## 🎨 Interfaz de Usuario

### **Colores por Tipo de Vital:**

| Vital | Color | Icono |
|-------|-------|-------|
| Presión Arterial (BP) | 🔵 Azul | ❤️ Corazón |
| Frecuencia Cardíaca (HR) | 🟢 Verde/Rojo* | 📈 Actividad |
| Saturación O2 (SPO2) | 🔵 Cyan/Rojo* | 💧 Gota |
| Temperatura (TEMP) | 🟠 Naranja | 🌡️ Termómetro |
| Glucosa (GLUCOSE) | 🟣 Púrpura | 💧 Gota |

*Verde = normal, Rojo = crítico

### **Indicadores de Criticidad:**

- **SpO2 < 90%**: ⚠️ Rojo (crítico)
- **FC < 50 o > 120 bpm**: ⚠️ Rojo (crítico)
- **Otros valores**: ✅ Verde (normal)

---

## 📋 Flujo de Trabajo Típico

### **Escenario: Paramédico en Ambulancia**

1. **Registra emergencia inicial**
   - PA: 90/60, FC: 48, SpO2: 89%, Temp: 36.7°C
   - Estado: "En Camino"

2. **Llega al lugar (10 minutos después)**
   - Actualiza estado a "En Escena"
   - Actualiza signos vitales:
     - PA: 95/65, FC: 52, SpO2: 91%
   - Sistema registra el cambio

3. **Durante traslado (15 minutos después)**
   - Actualiza estado a "En Traslado"
   - Actualiza signos vitales:
     - PA: 100/70, FC: 60, SpO2: 94%
   - Mejora visible en el historial

4. **Llega al hospital (20 minutos después)**
   - Actualiza estado a "En Hospital"
   - Últimos signos vitales:
     - PA: 110/75, FC: 65, SpO2: 96%
   - Médico puede ver todo el historial

5. **Médico en hospital**
   - Estado a "En Atención"
   - Continúa monitoreando y actualizando vitales
   - Historial completo disponible

---

## 🧪 Cómo Probar

### **Paso 1: Acceder a una Emergencia**
```
1. Login (admin, médico o ambulancia)
2. Ir a "Emergencias"
3. Click en el ojo 👁️ de cualquier emergencia
```

### **Paso 2: Actualizar Signos Vitales**
```
1. En la tarjeta "Signos Vitales Actuales"
2. Click en botón "Actualizar"
3. Ingresar nuevos valores:
   - PA: 115/75
   - FC: 72
   - SpO2: 97
   - Temp: 36.8
4. Click en "Guardar Cambios"
```

### **Paso 3: Verificar Historial**
```
1. Scroll hacia abajo
2. Ver tarjeta "Historial de Signos Vitales"
3. Debe aparecer el nuevo registro con timestamp
4. Repetir proceso varias veces
5. Ver cómo se construye el historial
```

---

## ⚠️ Validaciones Implementadas

### **Frontend:**
- ✅ SpO2 debe estar entre 0-100
- ✅ Temperatura acepta decimales
- ✅ FC debe ser número entero
- ✅ PA debe tener formato X/Y

### **Backend:**
- ✅ Usuario debe estar autenticado
- ✅ Al menos un signo vital debe tener valor
- ✅ Emergencia debe existir
- ✅ Se registra en audit_logs

---

## 🎉 Beneficios del Sistema

### **Para el Personal Médico:**
- 📊 **Monitoreo continuo** del paciente
- 📈 **Tendencias visibles** en el historial
- ⚠️ **Alertas automáticas** por valores críticos
- 📝 **Trazabilidad completa** de quién registró qué

### **Para la Gestión:**
- 📋 **Auditoría completa** de todos los cambios
- 👥 **Responsabilidad clara** (quién registró cada valor)
- ⏰ **Timestamps precisos** para análisis
- 📊 **Datos estructurados** para reportes

### **Para la Calidad:**
- ✅ **Cumplimiento** de protocolos médicos
- 📈 **Análisis de tendencias** por paciente
- 🔍 **Identificación de patrones** críticos
- 📊 **Estadísticas** para mejora continua

---

## 🚀 Resultado Final

Ahora tienes un **sistema completo** que:

✅ Permite actualizar signos vitales fácilmente  
✅ Registra automáticamente cada cambio  
✅ Muestra historial visual y organizado  
✅ Identifica valores críticos con colores  
✅ Mantiene auditoría completa  
✅ Es responsive y fácil de usar  
✅ Funciona en tiempo real  

---

## 💡 Próximas Mejoras Sugeridas

- 📊 Gráficas de tendencias de signos vitales
- 🔔 Notificaciones push por valores críticos
- 📱 App móvil para paramédicos
- 🤖 Alertas inteligentes con IA
- 📈 Dashboard analítico para gestión
- 🖨️ Generación de reportes PDF

---

**¡El sistema está completamente funcional y listo para usar!** 🎊



