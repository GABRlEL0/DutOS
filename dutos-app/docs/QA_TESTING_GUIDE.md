# 🧪 DUTOS - Guía de Pruebas Exhaustivas (QA)

> **IMPORTANTE**: Este documento es la fuente de verdad para la validación del sistema antes de producción. Se debe seguir ESTRICTAMENTE cada paso. Si un paso falla, debe reportarse inmediatamente con el ID del caso (ej: `ADMIN-01-A`).

---

## 📋 Preparación del Entorno
Antes de comenzar, asegúrate de tener usuarios creados para cada rol.

| Rol | Email Sugerido | Contraseña | Rol en Sistema |
|-----|----------------|------------|----------------|
| **Admin** | `admin@dutos.com` | `123456` | `admin` |
| **Manager** | `manager@dutos.com` | `123456` | `manager` |
| **Creative** | `creative@dutos.com` | `123456` | `creative` |
| **Production** | `prod@dutos.com` | `123456` | `production` |
| **Client** | `cliente@marca.com` | `123456` | `client` |

---

## � 1. Pruebas de Autenticación y Seguridad

### AUTH-01: Login y Logout
- [ ] **A01-A**: Ingresar con credenciales válidas. -> *Redirección al dashboard*.
- [ ] **A01-B**: Ingresar con contraseña incorrecta. -> *Mensaje "Error al iniciar sesión"*.
- [ ] **A01-C**: Ingresar con email no registrado. -> *Mensaje "Usuario no encontrado"*.
- [ ] **A01-D**: Logout desde el menú lateral. -> *Redirección a /login*.
- [ ] **A01-E**: Intentar acceder a `/` sin estar logueado. -> *Redirección forzada a /login*.

---

## 👤 2. Rol: ADMINISTRADOR (Control Total)

El Admin es el **único** que puede gestionar usuarios y borrar clientes.

### ADMIN-01: Gestión de Usuarios
- [ ] **U01-A**: Crear usuario con email válido y rol `Creative`. -> *Usuario aparece en lista*.
- [ ] **U01-B**: Intentar crear usuario con email ya existente (o mal formato). -> *Error de validación*.
- [ ] **U01-C**: Editar usuario "Creative" y cambiar rol a `Manager`. -> *Cambio reflejado instantáneamente*.
- [ ] **U01-D**: Desactivar usuario (Estado `Inactivo`). -> *Intentar login con ese usuario debe fallar*.
- [ ] **U01-E**: Reactivar usuario. -> *Login debe funcionar nuevamente*.

### ADMIN-02: Gestión de Clientes
- [ ] **C01-A**: Crear Cliente "QA Test" con capacidad 5 y pilares "Ventas, Branding". -> *Cliente creado*.
- [ ] **C01-B**: Crear Cliente sin nombre o sin capacidad. -> *Botón "Crear" deshabilitado o error*.
- [ ] **C01-C**: Editar Cliente: cambiar capacidad a 10 y agregar link de Drive. -> *Cambios persistidos*.
- [ ] **C01-D**: Buscador: Escribir "QA". -> *Solo debe aparecer el cliente creado*.

### ADMIN-03: Brand Kit (Configuración)
- [ ] **B01-A**: Ir a detalle de cliente > "Brand Kit".
- [ ] **B01-B**: Agregar color `#FF5733` nombre "Naranja". -> *Color aparece en la paleta*.
- [ ] **B01-C**: Agregar tipografía "Roboto". -> *Tipografía listada*.
- [ ] **B01-D**: Subir/Pegar link de logo en Assets. -> *Asset listado*.
- [ ] **B01-E**: Recargar página. -> *La información del Brand Kit debe persistir*.

### ADMIN-04: Dashboard SLA
- [ ] **S01-A**: Entrar a `/analytics/sla`.
- [ ] **S01-B**: Verificar que cargue sin errores (incluso con 0 datos).
- [ ] **S01-C**: Filtrar por "QA Test". -> *Métricas deben ponerse en 0 (si es nuevo)*.

---

## 🧑‍💼 3. Rol: MANAGER (Gestión de Flujo)

### MGR-01: Templates (Plantillas)
- [ ] **T01-A**: Crear Template "Plantilla Global" (sin asignar cliente). -> *Disponible para todos*.
- [ ] **T01-B**: Crear Template "Plantilla QA" (asignada a "QA Test"). -> *Solo disponible para ese cliente*.
- [ ] **T01-C**: Editar una plantilla existente y guardar cambios.

### MGR-02: Ciclo de Vida del Post
- [ ] **P01-A (Creación)**: Crear Post para "QA Test" desde Template "Plantilla QA". -> *Campos pre-llenados*.
- [ ] **P01-B (Edición)**: Modificar el copy del post. Guardar.
- [ ] **P01-C (Aprobación)**: Cambiar estado a `Pendiente`. Aprobar desde la tabla (`⋮` > Aprobar). -> *Estado `Aprozado`*.
- [ ] **P01-D (Rechazo)**: Cambiar estado a `Pendiente`. Rechazar. -> *Debe EXIGIR escribir motivo*. Escribir "Corregir ortografía". -> *Estado `Rechazado`*.
- [ ] **P01-E (Feedback)**: Abrir post rechazado. Verificar que el historial muestre "Corregir ortografía".

### MGR-03: Comentarios en Tiempo Real
- [ ] **COM-01**: Abrir un post. Escribir "Hola @Creative". -> *Comentario aparece con timestamp*.
- [ ] **COM-02**: Verificar que el contador de comentarios en la tabla (badge) aumente.

### MGR-04: Vista de Cola (Queue)
- [ ] **Q01-A**: Arrastrar un post de una semana a otra. -> *La fecha visual debe actualizarse*.
- [ ] **Q01-B**: Crear 6 posts para un cliente con capacidad 5. -> *El 6to post debe mostrar alerta visual (sobrecarga)*.
- [ ] **Q01-C**: Verificar que posts viejos (+4 semanas) tengan borde naranja (Stale).

---

## 🎨 4. Rol: CREATIVE (Ejecución)

### CRV-01: Permisos Restringidos
- [ ] **R01-A**: Intentar ver usuarios (`/users`). -> *Acceso denegado/Redirección*.
- [ ] **R01-B**: Intentar aprobar un post propio. -> *Opción no disponible*.
- [ ] **R01-C**: Intentar editar el Brand Kit de un cliente. -> *Solo lectura (o no editable)*.

### CRV-02: Trabajo Diario
- [ ] **W01-A**: Filtrar tabla por "Mis Posts" o estado "Rechazado".
- [ ] **W01-B**: Editar post rechazado anteriormente. Corregir según feedback.
- [ ] **W01-C**: Cambiar estado de `Rechazado` a `Pendiente`.

---

## 🎥 5. Rol: PRODUCTION (Entrega)

### PROD-01: Finalización
- [ ] **F01-A**: Tabla filtrada por estado `Aprobado`.
- [ ] **F01-B**: Entrar a post. Marcar checkbox "Asset listo" o pegar link final.
- [ ] **F01-C**: Cambiar estado a `Terminado`. -> *El post desaparece de su vista (pasa al cliente)*.

---

## 🏢 6. Rol: CLIENTE (Portal Externo)

### CLI-01: Portal Cliente
- [ ] **CP01-A**: Login. Debe redireccionar a `/client` (NO al dashboard general).
- [ ] **CP01-B**: Verificar que el menú lateral es diferente (Inicio, Contenido, Solicitudes, Brand Kit).
- [ ] **CP01-C**: Brand Kit. Verificar que puede ver sus colores/logos pero NO editarlos.

### CLI-02: Aprobación Final
- [ ] **CP02-A**: Ir a "Contenido". Debe ver el post que Producción marcó como `Terminado`.
- [ ] **CP02-B**: Aprobar post. -> *Estado final `Publicado` (o listo para publicar)*.
- [ ] **CP02-C**: Solicitar Cambios. -> *El post vuelve a flujo (estado `Rechazado` o similar según lógica)*.

### CLI-03: Solicitudes (Requests)
- [ ] **REQ-01**: Crear solicitud "Video de Navidad". Prioridad Alta.
- [ ] **REQ-02**: (Como Admin/Manager) Ir a `/requests`. Ver la solicitud. Responder "Ok, lo agendamos".
- [ ] **REQ-03**: (Como Cliente) Ver la respuesta del Admin.

---

## 📱 7. Funcionalidades Móviles (Responsive)

Pruebas obligatorias en celular o Simulador Móvil (Chrome DevTools).

### MOB-01: UX Móvil
- [ ] **M01-A**: Menú inferior (Bottom Nav) visible en lugar del Sidebar.
- [ ] **M01-B**: Tablas se convierten en tarjetas o listas scrollables.
- [ ] **M01-C**: Botones de acción (Crear, Editar) accesibles con el dedo (tamaño adecuado).

### MOB-02: Gestos (Swipe)
- [ ] **G01-A**: Ir a `/tareas` (Mis Tareas).
- [ ] **G01-B**: Swipe Derecha en una tarjeta -> *Acción positiva (Aprobar/Terminar)*.
- [ ] **G01-C**: Swipe Izquierda -> *Acción negativa (Rechazar)*.

---

## 🧪 8. Casos Borde (Edge Cases)

### EDGE-01: Validaciones y Errores
- [ ] **E01-A (Vacío)**: Crear post sin cliente ni pilar. -> *Error*.
- [ ] **E01-B (Texto Largo)**: Caption de 2000 caracteres. -> *UI no se rompe, scroll interno*.
- [ ] **E01-C (Offline)**: Desconectar WiFi. Navegar por secciones visitadas. -> *Debe mostrar contenido (PWA Cache)*.
- [ ] **E01-D (Reconexión)**: Crear un post offline (si está habilitado) o reconectar y verificar sincronización.

### EDGE-02: Navegación Cruzada
- [ ] **E02-A**: Copiar URL de un post (`/posts/123`). Loguearse con otro usuario sin permisos (ej: Cliente de otra empresa). Pegar URL. -> *Acceso Denegado*.
