# 🏗️ FASE 1: Base & Estrategia

**Duración estimada:** 1-2 semanas  
**Complejidad:** 🟡 Media  
**Dependencias:** Fase 0 completada

---

## Objetivo

Implementar la base del sistema: autenticación, sistema de roles, gestión de clientes y configuración de pilares estratégicos.

---

## 1.1 Sistema de Autenticación

### Tareas
- [ ] Página de login con email/password (Firebase Auth)
- [ ] Validación de formularios y manejo de errores
- [ ] Persistencia de sesión
- [ ] Redirección según rol
- [ ] Store de estado global con Zustand

### Archivos a Crear
```
src/pages/auth/LoginPage.tsx
src/services/firebase/auth.ts
src/stores/authStore.ts
src/components/common/ProtectedRoute.tsx
```

### Permisos por Rol
| Rol | Permisos |
|-----|----------|
| Admin | Acceso total (`*`) |
| Manager | Ver clientes/posts, aprobar/rechazar, reordenar cola |
| Creative | Ver clientes/posts, crear/editar propios posts |
| Production | Ver tareas asignadas, completar posts |
| Client | Ver roadmap propio (solo lectura) |

---

## 1.2 Gestión de Usuarios (Solo Admin)

### Tareas
- [ ] Vista de lista de usuarios
- [ ] Crear usuario (email + rol manualmente)
- [ ] Editar rol de usuario
- [ ] Desactivar usuario (soft delete)

### Modelo de Datos
```json
{
  "id": "user_001",
  "email": "admin@duts.com",
  "name": "Admin User",
  "role": "admin",
  "status": "active",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 1.3 Hub del Cliente (Módulo A)

### Tareas
- [ ] CRUD completo de clientes
- [ ] Vista lista (cards) y detalle
- [ ] Editor de links de Google Drive con validación RegEx
- [ ] Editor de pilares estratégicos (tags)
- [ ] Selector de capacidad semanal

### Modelo de Datos
```json
{
  "id": "client_001",
  "name": "DUTS Agency",
  "logo": "url",
  "status": "active",
  "weekly_capacity": 3,
  "drive_links": {
    "root": "https://drive.google.com/...",
    "strategy_00": "...",
    "branding_01": "...",
    "raw_02": "...",
    "raw_03": "...",
    "final_04": "..."
  },
  "strategy_pillars": ["Branding", "Venta", "Educativo"]
}
```

### Validación Drive Links
```typescript
const DRIVE_REGEX = /^https:\/\/(drive|docs)\.google\.com\/.+/;
```

---

## 1.4 Layout Principal

### Tareas
- [ ] Sidebar de navegación (responsive, collapse en mobile)
- [ ] Header con usuario actual
- [ ] Navegación diferenciada por rol
- [ ] Badges de notificación (contadores rojos)

### Menú por Rol
| Rol | Menú |
|-----|------|
| Admin | Dashboard, Clientes, Contenido, Usuarios, Config |
| Manager | Dashboard, Clientes, Contenido, Cola |
| Creative | Dashboard, Clientes, Contenido |
| Production | Mis Tareas, Contenido |

---

## 1.5 Dashboard Inicial

### Widgets por Rol
- **Admin/Manager:** Clientes activos, Pendientes de aprobación, Alertas stale
- **Creative:** Mis borradores, Rechazados
- **Production:** Tareas asignadas

---

## Reglas Firestore

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if getUserRole() == 'admin';
}

match /clients/{clientId} {
  allow read: if isAuthenticated();
  allow create, update: if getUserRole() in ['admin', 'manager'];
  allow delete: if getUserRole() == 'admin';
}
```

---

## Entregables

| Entregable | Criterio |
|------------|----------|
| Login funcional | Auth con Firebase |
| Sistema de roles | Permisos verificados |
| CRUD Usuarios | Admin puede gestionar |
| CRUD Clientes | Completo con Drive links |
| Layout responsive | Navegación por rol |
| Dashboard | Vista inicial funcional |

---

⬅️ [FASE 0](./FASE_0_SETUP.md) | ➡️ [FASE 2](./FASE_2_CONTENT_FACTORY.md)
