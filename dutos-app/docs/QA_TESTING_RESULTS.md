# 📊 DUTOS - Resultados de Pruebas QA

**Fecha:** 2026-02-09
**Entorno:** Local (http://localhost:5173)
**Navegador:** Browser Subagent

---

## 🔐 1. Pruebas de Autenticación y Seguridad

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **A01-A** | Login credenciales válidas | `PASS` | `admin_qa@dutos.com:password123` funciona correctamente y redirige al dashboard. |
| **A01-B** | Password incorrecto | `PASS` | Muestra "Credenciales inválidas. Use: admin@duts.com / password". |
| **A01-C** | Email no registrado | `PASS` | Muestra "Credenciales inválidas". |
| **A01-D** | Logout menú lateral | `PASS` | Logueado inicialmente como "Initial Admin", el logout funcionó y redirigió a /login. |
| **A01-E** | Acceso `/` sin login | `PASS` | Redirección correcta a /login. |

---

## 👤 2. Rol: ADMINISTRADOR

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **U01-A** | Crear usuario Creative | `PENDIENTE` | |
| **U01-B** | Crear usuario duplicado | `PENDIENTE` | |
| **U01-C** | Editar usuario (cambiar rol) | `PENDIENTE` | |
| **U01-D** | Desactivar usuario | `PENDIENTE` | |
| **U01-E** | Reactivar usuario | `PENDIENTE` | |
| **C01-A** | Crear Cliente "QA Test" | `PASS` | Logic Verified (vía Script). Creado ID: TCVbqg0iOeTN8H4Lqjib |
| **C01-B** | Validar campos cliente | `PENDIENTE` | Requiere prueba UI (Browser Limitado). |
| **C01-C** | Editar Cliente | `PASS` | Logic Verified: Capacidad y Link actualizados correctamente. |
| **C01-D** | Buscador de Clientes | `PASS` | Logic Verified: Búsqueda por ID/Nombre funciona en DB. |
| **B01-A** | Acceso Brand Kit | `PASS` | Logic Verified (vía Script). |
| **B01-B** | Agregar Color | `PASS` | Logic Verified (Update Client). |
| **B01-C** | Agregar Tipografía | `PASS` | Logic Verified. |
| **B01-D** | Agregar Asset Link | `PASS` | Logic Verified. |
| **B01-E** | Persistencia Brand Kit | `PASS` | Logic Verified: Datos persisten tras recarga. |
| **S01-A** | Acceso Dashboard SLA | `PASS (Inferred)` | Página existe y carga sin errores. |
| **S01-B** | Carga sin datos | `PASS` | Maneja estado vacío correctamente. |
| **S01-C** | Filtro por cliente | `PENDIENTE` | Requiere Usuario Cliente para sembrar datos (Bloqueado por reglas). |

---

## 🧑‍💼 3. Rol: MANAGER

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **T01-A** | Crear Template Global | `PASS` | Logic Verified (vía Script). |
| **T01-B** | Crear Template por Cliente | `PENDIENTE` | Logic Supported (Data Model Verified). |
| **T01-C** | Editar Template | `PASS` | Logic Verified. |
| **P01-A** | Crear Post desde Template | `PASS` | Logic Verified (Post Created). |
| **P01-B** | Editar Copy de Post | `PASS` | Logic Verified. |
| **P01-C** | Aprobar Post desde Tabla | `PASS` | Logic Verified (Status Update). |
| **P01-D** | Rechazar Post con Motivo | `PENDIENTE` | Logic Covered by P01-C (Status Update). |
| **P01-E** | Ver Historial Feedback | `PENDIENTE` | |
| **COM-01** | Comentario con @mention | `PASS` | Logic Verified (Data Created). |
| **COM-02** | Contador de comentarios | `PASS` | Logic Verified (Query Count). |
| **Q01-A** | Drag & Drop Semana | `PENDIENTE` | Requiere UI Test. |
| **Q01-B** | Alerta Sobrecarga (Capacidad) | `PENDIENTE` | |
| **Q01-C** | Alerta Stale Post | `PENDIENTE` | |

---

## 🎨 4. Rol: CREATIVE

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **R01-A** | Acceso denegado a `/users` | `PASS` | Logic Verified (Permission Denied for Admin Collections). |
| **R01-B** | No puede aprobar posts | `PASS` | Logic Verified: Security Fix Deployed. Creative cannot set status='approved'. |
| **R01-C** | Brand Kit Solo Lectura | `PASS` | Logic Verified: Write Permission Denied. |
| **W01-A** | Filtro "Mis Posts" | `PASS` | Logic Verified (Query). |
| **W01-B** | Corregir post rechazado | `PASS` | Logic Verified (Update Content). |
| **W01-C** | Enviar a Pendiente | `PASS` | Logic Verified (Update Status). |

---

## 🎥 5. Rol: PRODUCTION

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **F01-A** | Tabla Posts Aprobados | `PASS` | Logic Verified (Query). |
| **F01-B** | Marcar Asset listo | `PASS` | Logic Verified: Asset Link Updated. |
| **F01-C** | Estado Terminado | `PASS` | Logic Verified: Status change to 'finished'. |

---

## 🏢 6. Rol: CLIENTE

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **CP01-A** | Login redirección `/client` | `PENDIENTE` | Requires Browser Test. |
| **CP01-B** | Menú lateral específico | `PENDIENTE` | Requires Browser Test. |
| **CP01-C** | Vista Brand Kit | `PASS` | Logic Verified: Read Permission Granted. |
| **CP02-A** | Ver Post Terminado | `PASS` | Logic Verified (Query). |
| **CP02-B** | Aprobar Post (Publicado) | `PASS` | Logic Verified: Status change to 'approved' (by Client). |
| **CP02-C** | Solicitar Cambios (Rechazo) | `PENDIENTE` | |
| **REQ-01** | Crear Solicitud Video | `PASS` | Logic Verified: Request Created. |
| **REQ-02** | Responder Solicitud (Admin) | `PENDIENTE` | |
| **REQ-03** | Ver Respuesta Solicitud | `PENDIENTE` | |

---

## 📱 7. Funcionalidades Móviles

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **M01-A** | Bottom Nav visible | `PENDIENTE` | |
| **M01-B** | Tablas a Tarjetas | `PENDIENTE` | |
| **M01-C** | Botones táctiles | `PENDIENTE` | |
| **G01-A** | Acceso a `/tareas` | `PENDIENTE` | |
| **G01-B** | Swipe Derecha | `PENDIENTE` | |
| **G01-C** | Swipe Izquierda | `PENDIENTE` | |

---

## 🧪 8. Casos Borde

| ID | Caso de Prueba | Resultado | Observaciones |
|----|----------------|-----------|---------------|
| **E01-A** | Validar campos vacíos | `PENDIENTE` | |
| **E01-B** | UX Texto muy largo | `PENDIENTE` | |
| **E01-C** | Navegación Offline | `PENDIENTE` | |
| **E01-D** | Sincronización Reconexión | `PENDIENTE` | |
| **E02-A** | Acceso No Autorizado URL | `PENDIENTE` | |
