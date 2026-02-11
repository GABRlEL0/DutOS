# 📖 DUTOS - Manual de Usuario

> Guía completa para usar el Sistema Operativo de Contenidos

---

## 🚀 Primeros Pasos

### Acceso al Sistema
1. Ingresa a la URL del sistema
2. Introduce tu email y contraseña
3. Presiona "Iniciar Sesión"

### Navegación
- **Desktop**: Menú lateral izquierdo
- **Mobile**: Barra inferior con iconos

---

## 👥 Gestión de Clientes

### Ver Clientes
1. Click en **Clientes** en el menú
2. Usa el buscador para filtrar
3. Click en un cliente para ver detalles

### Crear Cliente (Admin/Manager)
1. Click en **"+ Nuevo Cliente"**
2. Completa los campos:
   - Nombre
   - Capacidad semanal (posts por semana)
   - Pilares estratégicos (separados por coma)
   - Links de Google Drive
3. Click en **"Crear Cliente"**

---

## ✍️ Gestión de Posts

### Ver Posts
1. Click en **Contenido** en el menú
2. Selecciona un cliente del dropdown
3. Navega entre vistas: Tabla o Cola

### Crear Post
1. Click en **"+ Nuevo Post"**
2. Selecciona cliente y pilar
3. Escribe el guion y/o caption
4. Opcional: Agrega link de Google Drive
5. Click en **"Crear Post"**

### Estados de un Post

| Estado | Significado |
|--------|-------------|
| 📝 Borrador | En proceso de creación |
| ⏳ Pendiente | Esperando aprobación |
| ❌ Rechazado | Requiere cambios |
| ✅ Aprobado | Listo para producción |
| 🎬 Terminado | Video/asset completado |
| 📤 Publicado | Ya se publicó en redes |

### Aprobar/Rechazar Posts (Admin/Manager)
1. Encuentra el post en la tabla
2. Click en el menú de acciones (⋮)
3. Selecciona "Aprobar" o "Rechazar"
4. Si rechazas, escribe el motivo (mín. 10 caracteres)

---

---

## 💬 Comentarios y Colaboración

### Comentarios en Posts
1. Abre un post en modo edición
2. En el panel lateral derecho, verás la sección de comentarios
3. Escribe tu mensaje y presiona Enter
4. Usa **@** para mencionar a otros usuarios (Admin, Manager, Creative)

---

## 🎨 Herramientas Creativas

### Templates de Contenido
Acelera la creación de posts usando plantillas predefinidas.

**Crear Template (Admin/Manager)**:
1. Ve a la sección **Templates** en el menú
2. Click en **"+ Nuevo Template"**
3. Define nombre, script base, caption base y pilar sugerido
4. Elige si es Global o para un Cliente específico

**Usar Template**:
1. Al crear un nuevo post, busca el selector "Cargar desde Template"
2. Selecciona la plantilla deseada
3. Los campos se completarán automáticamente

### Brand Kit
Gestiona la identidad visual de cada cliente.

1. Ve al detalle de un cliente
2. Busca la sección **Brand Kit** al final
3. Configura:
   - **Colores**: Paleta principal y secundaria (HEX)
   - **Tipografía**: Fuentes para títulos y cuerpo
   - **Assets**: Logos, iconos y recursos gráficos
   - **Voz y Tono**: Guía de comunicación

---

## 📊 Analytics y SLA

### Dashboard SLA (Admin/Manager)
Monitorea el rendimiento del equipo y el cumplimiento de tiempos.

1. Ve a **Dashboard SLA** en el menú
2. Filtra por:
   - **Cliente específico**
   - **Período** (Semana, Mes, Trimestre)
3. Analiza métricas clave:
   - **Tiempo de Respuesta**: Promedio desde solicitud hasta acción
   - **Tasa de Conversión**: % de solicitudes que se vuelven posts
   - **Volumen**: Total de actividad por estado

---

## 📅 Vista de Cola

La cola muestra los posts organizados por semana con fechas calculadas automáticamente.

### Interpretar la Cola
- **Fecha visual**: Cuándo se espera publicar
- **Borde naranja**: Contenido stale (+4 semanas de espera)
- **Sobrecarga**: Más posts que capacidad semanal

### Reordenar Posts
1. Arrastra un post a nueva posición
2. Suelta para aplicar el cambio
3. Las fechas se recalculan automáticamente

---

## 📊 Dashboard

El dashboard muestra métricas en tiempo real:

| Widget | Descripción |
|--------|-------------|
| Clientes Activos | Cantidad de clientes activos |
| Pendientes | Posts esperando aprobación |
| Estancados | Contenido con +4 semanas de espera |
| Total Posts | Todos los posts en el sistema |
| Publicados | Posts ya publicados |
| En Cola | Posts pendientes de publicación |

---

## 📱 Funciones Mobile

### Mis Tareas (/tareas)
Vista optimizada para móvil con tareas por rol:
- **Admin/Manager**: Posts pendientes de aprobación
- **Creative**: Posts rechazados (para corregir)
- **Production**: Posts aprobados (para producir)

### Swipe Gestures
En posts pendientes:
- **Deslizar derecha** → Aprobar ✅
- **Deslizar izquierda** → Rechazar ❌

---

## 📤 Importar/Exportar CSV

### Exportar Posts
1. Ve a **Contenido**
2. Click en **"CSV"**
3. Selecciona cliente (o todos)
4. Click **"Exportar CSV"**

### Importar Posts
1. Ve a **Contenido**
2. Click en **"CSV"**
3. Tab **"Importar"**
4. Descarga la plantilla
5. Complétala en Excel/Sheets
6. Arrastra el archivo CSV
7. Revisa errores si los hay
8. Click **"Importar X posts"**

### Formato CSV

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| client_name | Nombre exacto del cliente | "Empresa ABC" |
| type | flow o pinned | flow |
| pillar | Pilar estratégico del cliente | "Educativo" |
| script | Guion del video | "Hola, hoy vamos a..." |
| caption | Texto para redes | "📱 Nuevo post..." |
| asset_link | Link Google Drive | https://drive.google.com/... |
| status | Estado inicial | draft |
| pinned_date | Solo si type=pinned | 2024-03-15 |

---

## ⚙️ Configuración (Admin)

### Gestionar Usuarios
1. Click en **Usuarios** en el menú
2. Click en **"+ Nuevo Usuario"**
3. Completa email, nombre y rol
4. El usuario recibirá credenciales por email

### Cambiar Rol de Usuario
1. Busca al usuario en la lista
2. Click en el menú de acciones
3. Selecciona **"Cambiar rol"**
4. Elige el nuevo rol

---

## ❓ Preguntas Frecuentes

### ¿Por qué no puedo aprobar posts?
Solo Admin y Manager pueden aprobar. Verifica tu rol con el administrador.

### ¿Cómo sé si un post está atrasado?
Busca el borde naranja y el ícono ⚠️ en la tabla o cola.

### ¿Se pierden los datos offline?
No, el sistema guarda cambios localmente y sincroniza al reconectar.

### ¿Cómo instalo la app en mi celular?
En el navegador, busca el ícono de "Instalar" o "Agregar a pantalla de inicio".

---

## 📞 Soporte

Para asistencia técnica, contacta al administrador del sistema.
