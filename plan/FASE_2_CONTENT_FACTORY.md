# ⚙️ FASE 2: Content Factory (Core)

**Duración estimada:** 2-3 semanas  
**Complejidad:** 🟠 Media-Alta  
**Dependencias:** Fase 1 completada

---

## Objetivo

Implementar el motor de contenido: CRUD de posts, vista de tabla desktop con carga masiva, formulario móvil, y sistema de estados con workflow completo.

---

## 2.1 Modelo de Datos - Posts

```json
{
  "id": "post_001",
  "client_id": "client_001",
  "type": "flow",  // "flow" | "pinned"
  "pinned_date": null,  // Timestamp si es pinned
  "priority_index": 1,  // Entero global por cliente
  "status": "draft",
  "pillar": "Branding",  // String del pilar estratégico
  "content": {
    "script": "Texto del guion...",
    "caption": "Copy para redes...",
    "asset_link": "https://drive.google.com/..."
  },
  "feedback_history": [
    {
      "user": "Manager",
      "comment": "Falta energía en el inicio",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "user_id"
}
```

---

## 2.2 CRUD de Posts

### Tareas
- [ ] Crear post (con pilar obligatorio)
- [ ] Editar post (según permisos de rol)
- [ ] Vista detalle de post
- [ ] Eliminar post (soft delete, solo Admin)
- [ ] Asignación automática de priority_index

### Restricciones por Rol
| Rol | Crear | Editar | Eliminar |
|-----|-------|--------|----------|
| Admin | ✅ | ✅ Todos | ✅ |
| Manager | ✅ | ✅ Todos | ❌ |
| Creative | ✅ | Solo propios | ❌ |
| Production | ❌ | Solo completar | ❌ |

---

## 2.3 Vista de Tabla Desktop (Carga Masiva)

### Requisitos
- [ ] Tabla tipo Excel/Airtable (NO es un clon completo)
- [ ] Edición inline para campos cortos
- [ ] Modal/popup para textos largos (script, caption)
- [ ] Celdas auto-expandibles
- [ ] Filtros por: cliente, estado, pilar, tipo
- [ ] Ordenamiento por columnas

### Columnas de la Tabla
| Columna | Tipo | Editable |
|---------|------|----------|
| # | Prioridad | ❌ (drag) |
| Estado | Badge | ✅ (workflow) |
| Tipo | 🌊/⚓ | ✅ |
| Fecha | Calculada/Fija | ⚓ solo |
| Pilar | Dropdown | ✅ |
| Script | Textarea | ✅ (modal) |
| Caption | Textarea | ✅ (modal) |
| Asset | Link | ✅ |
| Acciones | Botones | - |

### Componentes
```
src/pages/posts/
├── PostsTablePage.tsx
├── components/
│   ├── PostsTable.tsx
│   ├── PostRow.tsx
│   ├── EditableCell.tsx
│   ├── TextModal.tsx
│   ├── StatusBadge.tsx
│   ├── PillarSelect.tsx
│   └── TableFilters.tsx
```

---

## 2.4 Vista Móvil (Feed Vertical)

### Requisitos
- [ ] Formulario paso a paso vertical
- [ ] Cards con información resumida
- [ ] Acciones de aprobación rápida (Manager)
- [ ] Vista "Mis Tareas" (Production)
- [ ] NO hay tabla en móvil

### Componentes
```
src/pages/posts/mobile/
├── PostsFeedPage.tsx
├── PostCard.tsx
├── PostFormMobile.tsx
└── ApprovalActions.tsx
```

---

## 2.5 Workflow de Estados

### Diagrama
```
Borrador ◄──► Pendiente Aprobación
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Rechazado          Aprobado
          │                   │
          └──► Pendiente ◄────┘
                    │
                    ▼
              Terminado
                    │
                    ▼
              Publicado
                    │
                    ▼ (Admin only)
               Borrador
```

### Transiciones Permitidas
| Desde | Hacia | Requiere |
|-------|-------|----------|
| Borrador | Pendiente | - |
| Pendiente | Borrador | - |
| Pendiente | Rechazado | Comentario obligatorio |
| Rechazado | Pendiente | Corrección realizada |
| Pendiente | Aprobado | Rol Manager/Admin |
| Aprobado | Terminado | Link de asset (Production) |
| Terminado | Publicado | - |
| Publicado | Borrador | Solo Admin |

### Historial de Feedback (Append-only)
```typescript
interface FeedbackEntry {
  user: string;
  comment: string;
  timestamp: Date;
}
// NUNCA se borra, solo se agregan entradas
```

---

## 2.6 Semáforo Visual

### Colores por Estado
| Estado | Color | Clase Tailwind |
|--------|-------|----------------|
| Borrador | Gris | `border-gray-400` |
| Pendiente | Amarillo | `border-yellow-400` |
| Rechazado | Rojo | `border-red-500` |
| Aprobado | Verde | `border-green-500` |
| Terminado | Azul | `border-blue-500` |
| Publicado | Púrpura | `border-purple-500` |

---

## 2.7 Validaciones

### Creación de Post
- [ ] Pilar estratégico OBLIGATORIO
- [ ] Cliente seleccionado
- [ ] Al menos script O caption

### Links de Asset
- [ ] Validación RegEx: `drive.google.com` o `docs.google.com`

### Rechazo
- [ ] Comentario obligatorio (mínimo 10 caracteres)

---

## Reglas Firestore

```javascript
match /posts/{postId} {
  allow read: if isAuthenticated();
  allow create: if getUserRole() in ['admin', 'manager', 'creative'];
  allow update: if canUpdatePost(postId);
  allow delete: if getUserRole() == 'admin';
}

function canUpdatePost(postId) {
  let role = getUserRole();
  let post = get(/posts/$(postId)).data;
  
  // Admin puede todo
  if (role == 'admin') return true;
  
  // Manager puede aprobar/rechazar
  if (role == 'manager') return true;
  
  // Creative solo sus propios posts en estados editables
  if (role == 'creative') {
    return post.createdBy == request.auth.uid 
      && post.status in ['draft', 'rejected'];
  }
  
  // Production solo puede completar
  if (role == 'production') {
    return post.status == 'approved';
  }
  
  return false;
}
```

---

## Entregables

| Entregable | Criterio |
|------------|----------|
| CRUD Posts | Crear, editar, ver |
| Vista Tabla | Edición inline funcional |
| Vista móvil | Feed con cards |
| Workflow | Transiciones correctas |
| Semáforo | Colores aplicados |
| Historial | Feedback persistente |

---

⬅️ [FASE 1](./FASE_1_BASE_ESTRATEGIA.md) | ➡️ [FASE 3](./FASE_3_LOGICA_INTELIGENTE.md)
