# **DUTOS – Especificación de Requerimientos de Software (SRS)**

**Versión:** 5.0 (Master \- Documento Completo Unificado) **Tipo de Proyecto:** Progressive Web App (PWA) / Herramienta Interna **Stakeholders:** DUTS Agencia de Marketing

---

## **1\. Visión del Producto y Contexto**

**DUTS OS** es una plataforma de gestión operativa diseñada para agencias de marketing, bajo la filosofía "Strategy-First".

* **El Problema:** Los gestores de tareas tradicionales (Trello/Asana) se enfocan en "tachar tareas" sin considerar la estrategia o el volumen contratado.  
* **La Solución:** Un sistema centralizado que obliga a vincular cada contenido a un "Pilar Estratégico" y gestiona la carga de trabajo mediante **cuotas semanales** y colas de prioridad, en lugar de fechas rígidas.  
  ---

  ## **2\. Stack Tecnológico y Arquitectura**

  ### **2.1. Tecnologías Requeridas**

* **Frontend:** React \+ Vite \+ Tailwind CSS.  
* **Backend / DB:** Firebase (Firestore & Authentication).  
* **Hosting:** Vercel o Firebase Hosting.  
* **Arquitectura:** Instancia Única (Internal Tool). No se requiere arquitectura Multi-tenant (SaaS).

  ### **2.2. Requerimiento PWA y Responsividad**

El sistema debe ser una **Progressive Web App** instalable.

* **Mobile (Roles Manager/Producción):** Prioridad absoluta a las vistas de "Aprobación", "Feed de Tareas" y Dashboard. La interfaz debe ser táctil y ágil.  
* **Desktop (Rol Creativo):** Prioridad a la carga masiva y gestión de estrategia.  
* **Manifest:** Configuración completa de iconos y splash screens para instalación en Home Screen (Android/iOS).  
  ---

  ## **3\. Integración con Google Drive (Gestión de Assets)**

**Principio:** El software actúa como un índice de enlaces inteligentes. **NO** almacena archivos pesados (videos, RAWs) ni incrusta reproductores.

### **3.1. Estructura de Carpetas (Externa)**

* **Automatización:** **Estrictamente Manual.** El Admin crea la estructura en Drive y pega los enlaces manualmente en la ficha del cliente en DUTS OS.  
* **Estructura Estándar Obligatoria:**  
  * `📂 [CLIENTE_ROOT]`  
    * `📂 00_Estrategia` (Brief, Contratos, Investigación).  
    * `📂 01_Identidad` (Manual de marca, logos, editables base).  
    * `📂 02_Bruto_Fotos` (Material raw).  
    * `📂 03_Bruto_Videos` (Material raw).  
    * `📂 04_Entregables` (Piezas finales para publicar).

### **Responsabilidad sobre la Estructura Externa**

* DUTS OS actúa como un **espejo de enlaces** hacia Google Drive.

* El sistema no valida la existencia ni integridad real de las subcarpetas.

* Si un enlace no funciona (404, acceso denegado, carpeta eliminada), se asume modificación manual en Drive.

* La responsabilidad de mantener la estructura recae en el equipo humano.

**Objetivo:** evitar sobreingeniería y dejar explícito el límite de responsabilidad del sistema.

### **3.2. Implementación en UI**

* **Acceso:** En el perfil del cliente, deben existir botones/iconos de acceso directo que abran estas carpetas en una **nueva pestaña**.  
* **Validación de Integridad:** En los campos donde los usuarios deban pegar un link (ej: Producción entregando un video), el sistema debe validar mediante **RegEx** que el dominio corresponda a `drive.google.com` o `docs.google.com`.  
  ---

  ## **4\. Perfiles de Usuario y Permisos**

**Modelo de Alta:** Creación Manual por Administrador (UID/Email).

1. **ADMIN / ESTRATEGA:**  
   * Acceso total al sistema.  
   * CRUD de Clientes y definición de "Pilares Estratégicos".  
   * Gestión de Usuarios.  
2. **MANAGER (Operaciones):**  
   * Visión de "Semáforo" (Estados).  
   * Aprueba/Rechaza contenido (con comentario obligatorio).  
   * Gestiona "Pedidos Extra" y reordena la prioridad de la cola.  
3. **CREATIVO:**  
   * Redacta guiones e ideas.  
   * **Restricción:** No puede crear contenido sin asignarle un "Pilar Estratégico".  
   * Uso principal: Escritorio (Carga Masiva).  
4. **PRODUCCIÓN:**  
   * Vista operativa ("Mis Tareas").  
   * Acceso rápido a links de material bruto (`02` y `03`) y carga de links finales (`04`).  
5. **CLIENTE (Futuro):**  
   * Solo lectura (Vista de Roadmap/Estado).

   ---

   ## **5\. Módulos Funcionales**

   ### **Módulo A: Hub del Cliente (Estrategia)**

* **Datos:** Nombre, Logo, Estado, Plan (ej: "3 acciones/semana").  
* **Configuración Estratégica:**  
  * **Pilares:** Etiquetas gestionables (ej: "Venta", "Humor", "Educativo").  
  * **Capacidad Semanal (`weekly_capacity`):** Número entero que define cuántos "Slots" (espacios) existen por semana para ese cliente.

  ### **Módulo B: Content Factory (Core)**

  #### **5.1. UX Diferencial: Carga Masiva (Desktop) vs Mobile**

* **Escritorio (Vista de Tabla):** Para facilitar el flujo del Creativo (que usa IA externa), el sistema ofrece una vista tipo Excel/Airtable.  
  * *Requisito:* Las celdas de "Script/Copy" deben ser **auto-expandibles** o tener un botón de "pop-up" para editar textos largos cómodamente.  
* **Móvil (Vista Feed):** La vista de tabla se deshabilita. Se usa un formulario paso a paso vertical para editar o aprobar.

  #### **5.2. Algoritmo de "Slots y Anclas" (Queue System)**

El calendario se rige por **Prioridad y Capacidad**, no solo por fechas.

1. **Gestión de Capacidad:** El sistema asume disponibilidad de Lunes a Viernes.  
2. **Tipos de Tareas:**  
   * **⚓ Anclada (Pinned):** Tarea con fecha inamovible (ej: Efemérides). Bloquea un día específico.  
   * **🌊 Flotante (Flow):** Tarea de relleno. Ocupa el primer slot libre disponible.  
3. **Lógica de Visualización (Matemática):**  
   * `Fecha_Visual` de una tarea Flotante \= Próximo día (L-V) que no esté ocupado por una tarea Anclada.  
4. **Comportamiento de la Cola (Ripple Effect):**  
   * **Disparador:** Al hacer Drag & Drop o cambiar la prioridad, el recálculo es inmediato en el frontend.  
   * **Re-numeración Compacta:** Si se mueve la tarea de prioridad 4 a la 2, la lista se re-numera (1, 2, 3...) sin dejar huecos.  
   * **Conflicto de Anclas:** Si un día está lleno de tareas Ancladas, el sistema **bloquea** e impide anclar más contenido en esa fecha.  
   * **Límites (Stale Content):** Alerta visual si una tarea flotante se desplaza más de **4 semanas**.

   #### **5.3. Workflow de Estados**

1. `Borrador` \<-\> `Pendiente Aprobación`.  
2. `Pendiente` \-\> `Rechazado` (**Obligatorio:** Comentario del motivo).  
3. `Rechazado` \-\> `Pendiente` (Tras corrección).  
4. `Pendiente` \-\> `Aprobado` (Visible para Producción).  
5. `Aprobado` \-\> `Terminado` (Producción pega link).  
6. `Terminado` \-\> `Publicado`.  
7. `Publicado` \-\> `Borrador` (Permiso especial de Admin para rollback).

**Historial de Feedback:** Es persistente (Append-only). Nunca se borra, sirve de auditoría.

---

## **6\. UX/UI y Notificaciones**

* **Semáforo Visual:** Bordes de color en tarjetas según estado (Rojo/Amarillo/Verde/Gris).  
* **Notificaciones Fase 1:** Badges (Contadores rojos) en el menú de navegación y dashboard.  
* **Notificaciones Fase 4:** Web Push Notifications para el rol Manager (Móvil).  
  ---

  ## **7\. Modelo de Datos (JSON Schema Referencia)**

  JSON  
1. // Colección: clients  
2. {  
3.   "id": "client\_001",  
4.   "name": "DUTS Agency",  
5.   "weekly\_capacity": 3,  
6.   "drive\_links": {  
7.     "root": "https://drive...",  
8.     "strategy\_00": "https://drive...",  
9.     "branding\_01": "https://drive...",  
10.     "raw\_02": "https://drive...",  
11.     "raw\_03": "https://drive...",  
12.     "final\_04": "https://drive..."  
13.   },  
14.   "strategy\_pillars": \["Branding", "Venta", "Meme"\]  
15. }  
16.   
17. // Colección: posts  
18. {  
19.   "id": "post\_999",  
20.   "client\_id": "client\_001",  
21.   "type": "flow", // "flow" | "pinned"  
22.   "pinned\_date": null, // Timestamp (Solo si es pinned)  
23.   "priority\_index": 1, // Integer (1, 2, 3...). Se re-calcula al mover.  
24.   "status": "pending\_approval",  
25.   "pillar": "Branding", // String persistido  
26.   "content": {  
27.     "script": "Texto del guion...",  
28.     "caption": "Copy para redes...",  
29.     "asset\_link": "https://drive..." // Validado por RegEx  
30.   },  
31.   "feedback\_history": \[  
32.     {  
33.       "user": "Flor",  
34.       "comment": "Falta energía en el inicio",  
35.       "timestamp": "2023-10-20T10:00:00Z"  
36.     }  
37.   \]  
38. }  
      
    ---

    ## **8\. Roadmap de Desarrollo**

1. **FASE 1 (Base & Estrategia):** Setup Firebase, Auth Manual, ABM Clientes y Configuración de Links de Drive (Manual).  
2. **FASE 2 (El Motor de Contenido):** CRUD de Posts, desarrollo de la **Vista de Tabla (Desktop)** con celdas expandibles y validación de formularios.  
3. **FASE 3 (Lógica Inteligente):** Implementación del algoritmo de "Slots y Anclas", Drag & Drop y re-numeración automática.  
4. **FASE 4 (Refinamiento PWA):** Optimización móvil, Web Push Notifications (Manager) y pulido de UX.

# **9\. Decisiones Funcionales Cerradas (Scope Lock)**

Este apartado define **criterios explícitos y no negociables** para evitar ambigüedades durante el desarrollo.  
 Todo lo aquí descrito se considera **decisión de producto cerrada**, salvo modificación posterior acordada.

---

## **9.1 Capacidad Semanal (`weekly_capacity`)**

* La capacidad semanal representa la **cantidad máxima de slots productivos por semana**, no un límite de creación.

* El sistema **NO bloquea** la creación de tareas si se supera la capacidad.

* Cuando la cantidad de tareas activas excede la capacidad semanal:

  * Se muestra una **alerta visual de sobrecarga**.

  * Las tareas se desplazan automáticamente en la cola (Flow).

* La capacidad es **por cliente**, no por usuario ni por tipo de contenido.

**Objetivo:** ordenar expectativas y visualizar carga real, sin frenar el trabajo.

---

## **9.2 Definición de Slot y Ocupación por Día**

* Un **slot** representa una unidad de trabajo, no un día completo.

* Un mismo día puede contener **múltiples tareas**, hasta agotar los slots disponibles según la capacidad semanal.

* Las tareas **Ancladas (Pinned)** ocupan slots en una fecha específica.

* Las tareas **Flotantes (Flow)** ocupan el próximo slot disponible respetando:

  * Días hábiles (Lunes a Viernes).

  * Prioridad en la cola.

  * Bloqueos por anclas.

**Objetivo:** permitir múltiples entregables por día sin romper la lógica de capacidad.

### **Distribución Equitativa de Tareas Flotantes (Daily Soft Limit)**

* El sistema utiliza un **límite diario blando (`daily_soft_limit`)** para distribuir las tareas Flotantes de forma equilibrada.

* El `daily_soft_limit` se calcula automáticamente como:

`daily_soft_limit = ceil(weekly_capacity / 5)`

* Este límite:

  * No es visible para el usuario.

  * No bloquea la asignación de tareas.

  * Se utiliza únicamente como criterio interno para evitar la concentración excesiva de tareas en un mismo día.

* En caso de superarse el límite blando, el sistema continúa asignando tareas al siguiente día hábil disponible.

**Objetivo:** evitar concentraciones operativas artificiales (ej. “lunes infernal”) sin introducir rigidez calendaria.

---

## **9.3 Conflictos de Anclaje**

* Si un día ya tiene ocupados todos sus slots disponibles por tareas Ancladas:

  * El sistema **impide** anclar nuevas tareas en esa fecha.

  * Se muestra un mensaje claro de conflicto al usuario.

* No se permite “forzar” anclas por encima de la capacidad diaria.

**Objetivo:** evitar sobrepromesas y choques operativos.

### **Efecto Dominó (Ripple Effect)**

* Ante la creación, modificación o eliminación de una tarea **Anclada (Pinned)**, el sistema:

  * Recalcula automáticamente la posición visual de todas las tareas Flotantes afectadas.

  * Empuja dichas tareas al próximo slot disponible respetando prioridad y días hábiles.

* Este recálculo ocurre **en tiempo real** en el frontend.

**Objetivo:** mantener coherencia visual y operativa entre la cola de prioridad y el calendario resultante.

---

## **9.4 Contenido Estancado (Stale Content)**

* Una tarea Flotante se considera “stale” si:

  * Se desplaza automáticamente más de **4 semanas** desde su posición original.

* El estado “stale”:

  * **NO bloquea** la tarea.

  * **NO cambia su estado**.

  * Genera únicamente una **alerta visual pasiva** (ícono / color).

* La alerta es visible para:

  * Admin

  * Manager

**Objetivo:** llamar la atención estratégica sin interrumpir el flujo.

---

## **9.5 Reordenamiento (Drag & Drop) y Estados**

* El Drag & Drop de prioridad está permitido únicamente para tareas en estado:

  * `Borrador`

  * `Pendiente Aprobación`

  * `Rechazado`

  * `Aprobado`

* Las tareas en estado:

  * `Terminado`

  * `Publicado`  
     no pueden ser reordenadas, salvo por un **Admin**.

* Cualquier cambio de prioridad:

  * Dispara una **re-numeración compacta** inmediata.

  * Recalcula fechas visuales en tiempo real (frontend).

**Objetivo:** preservar coherencia histórica y evitar desorden post-ejecución.

### **Alcance del Índice de Prioridad**

* El índice de prioridad es **único y global por cliente**.

* No se reinicia semanalmente.

* La posición en la cola define la fecha visual estimada según:

  * Capacidad semanal.

  * Límite diario blando.

  * Presencia de tareas Ancladas.

* El sistema puede mostrar tareas proyectadas a semanas futuras como resultado natural de la saturación.

**Objetivo:** reflejar backlog real y facilitar decisiones estratégicas sobre carga de trabajo.

---

## **9.6 Naturaleza de la Vista Tipo Excel (Desktop)**

* La vista tipo Excel:

  * Es una **tabla editable simple**, no un clon de Airtable.

* Edición permitida:

  * Inline para campos cortos.

  * Modal / pop-up para textos largos (script, copy).

* No incluye:

  * Fórmulas

  * Relaciones avanzadas

  * Automatizaciones internas

**Objetivo:** velocidad operativa y baja complejidad técnica.

---

## **9.7 Diferenciación Real Mobile vs Desktop**

* Mobile y Desktop **NO comparten la misma experiencia adaptada**.

* Desktop:

  * Pensado para Creativos y Estrategia.

  * Carga masiva, visión global, edición intensiva.

* Mobile:

  * Pensado para Manager y Producción.

  * Feed de tareas, aprobaciones rápidas, links directos.

* No se exige paridad funcional total entre vistas.

**Objetivo:** optimizar cada rol según su contexto real de uso.

---

## **9.8 Alcance del Sistema (Límites Explícitos)**

Este sistema **NO incluye** en esta versión:

* Gestión automática de archivos.

* Subida o procesamiento de media.

* Calendario editorial con publicación automática.

* Integración con redes sociales.

* Inteligencia artificial interna.

Cualquier funcionalidad fuera de este alcance se considera **fase futura**.

# **10\. Requerimientos No Funcionales**

Esta sección define los criterios de calidad, rendimiento y comportamiento general del sistema **DUTS OS**, independientes de la funcionalidad visible, y obligatorios para su correcta operación a largo plazo.

---

## **10.1 Rendimiento y Escalabilidad Operativa**

* El sistema debe mantener **tiempos de respuesta aceptables** en las siguientes operaciones, incluso con volúmenes elevados de datos:

  * Reordenamiento de tareas mediante Drag & Drop.

  * Re-numeración de la cola de prioridad.

  * Recalculo de fechas visuales (Slots y Anclas).

* Se considera volumen elevado:

  * Cientos o miles de tareas históricas por cliente.

  * Decenas o centenas de tareas activas simultáneas.

* El crecimiento del índice de prioridad (ej. prioridades \#1000 o superiores) **no debe degradar perceptiblemente** la experiencia del usuario.

**Objetivo:** garantizar fluidez operativa a largo plazo sin rediseños estructurales.

---

## **10.2 Consistencia y Confiabilidad de Datos**

* El sistema debe asegurar:

  * Consistencia entre el orden de prioridad y la fecha visual mostrada.

  * Persistencia correcta del historial de feedback (append-only).

* Ante recálculos automáticos (Ripple Effect):

  * No deben generarse estados intermedios inconsistentes visibles al usuario.

  * El usuario debe percibir siempre un estado coherente y estable.

**Objetivo:** mantener confianza operativa en la información mostrada.

---

## **10.3 Disponibilidad y Tolerancia a Errores Humanos**

* El sistema debe tolerar:

  * Enlaces externos inválidos o rotos (Google Drive).

  * Cambios manuales fuera del sistema.

* La falla de un enlace externo:

  * No debe bloquear el uso del sistema.

  * No debe generar errores críticos.

  * Debe manifestarse de forma clara (link no accesible).

**Objetivo:** asumir el error humano como parte del flujo normal sin penalizar al sistema.

---

## **10.4 Experiencia de Usuario (UX) y Percepción de Fluidez**

* Las operaciones críticas (reordenamiento, aprobación, cambio de estado) deben:

  * Ejecutarse de forma inmediata o percibirse como instantáneas.

  * Evitar recargas completas de vista.

* En operaciones que impliquen recálculos complejos:

  * Se permite el uso de indicadores visuales sutiles (loading, skeletons).

  * No se permite bloquear innecesariamente la interfaz.

**Objetivo:** transmitir sensación de sistema “vivo” y reactivo.

---

## **10.5 Seguridad y Control de Acceso**

* El acceso al sistema debe estar protegido mediante autenticación obligatoria.

* Cada acción debe respetar estrictamente los permisos del rol:

  * Visualización.

  * Edición.

  * Aprobación.

  * Reordenamiento.

* Acciones sensibles (rollback de estado, cambios post-publicación) deben estar restringidas al rol Admin.

**Objetivo:** proteger la integridad del flujo operativo y del historial.

---

## **10.6 Mantenibilidad y Evolución**

* La arquitectura debe permitir:

  * Agregar nuevos estados, roles o reglas sin reescribir el núcleo del sistema.

  * Ajustar reglas internas (ej. capacidad, distribución) sin impacto en datos históricos.

* El sistema debe estar preparado para:

  * Incorporar módulos futuros (ej. cliente, automatizaciones, IA).

  * Escalar en uso sin comprometer estabilidad.

**Objetivo:** asegurar vida útil prolongada del sistema como herramienta central de la agencia.

---

## **10.7 Alcance Tecnológico (No Funcional)**

* DUTS OS se concibe como:

  * Herramienta interna.

  * De instancia única.

  * Sin requerimientos de multi-tenant ni aislamiento entre clientes.

* Las decisiones técnicas internas (índices, estrategias de ordenamiento, optimizaciones) quedan a criterio del desarrollador, siempre que:

  * Se respete el comportamiento funcional definido.

  * Se cumplan los requerimientos no funcionales aquí descritos.

**Objetivo:** separar claramente el “qué” del sistema del “cómo” se implementa.

---

## **Cierre de Requerimientos No Funcionales**

El cumplimiento de estos requerimientos es condición necesaria para considerar el sistema **apto para uso operativo real**, más allá de que la funcionalidad esté implementada.

---

Si querés, el siguiente paso ideal sería:

* armar una **checklist de aceptación** (QA / Go-Live), o

* preparar un **documento de handoff final** para el desarrollador con hitos y criterios de entrega.

