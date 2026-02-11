# 🧠 FASE 3: Lógica Inteligente (Slots y Anclas)

**Duración estimada:** 2-3 semanas  
**Complejidad:** 🔴 Alta  
**Dependencias:** Fase 2 completada

---

## Objetivo

Implementar el algoritmo core de DUTOS: sistema de Slots y Anclas, cálculo de fechas visuales, Drag & Drop con re-numeración automática, y alertas de contenido estancado.

---

## 3.1 Conceptos Clave

### Tipos de Tareas
| Tipo | Icono | Comportamiento |
|------|-------|----------------|
| **Flow** (Flotante) | 🌊 | Ocupa el primer slot libre disponible |
| **Pinned** (Anclada) | ⚓ | Bloquea un día específico inamovible |

### Capacidad y Slots
- **weekly_capacity:** Máximo de slots productivos por semana (por cliente)
- **daily_soft_limit:** `ceil(weekly_capacity / 5)` - Distribución automática
- El sistema NO bloquea si se supera, solo alerta

---

## 3.2 Algoritmo de Fechas Visuales

### Lógica de Cálculo
```typescript
interface SlotResult {
  date: Date;
  isOverloaded: boolean;
}

function calculateVisualDate(
  post: Post,
  allPosts: Post[],
  client: Client
): SlotResult {
  // Si es Pinned, retorna la fecha fija
  if (post.type === 'pinned' && post.pinned_date) {
    return { date: post.pinned_date, isOverloaded: false };
  }

  // Para Flow: calcular próximo slot disponible
  const dailyLimit = Math.ceil(client.weekly_capacity / 5);
  let currentDate = getNextBusinessDay(new Date());
  
  // Ordenar posts por prioridad
  const sortedPosts = allPosts
    .filter(p => p.priority_index < post.priority_index)
    .sort((a, b) => a.priority_index - b.priority_index);

  // Contar slots ocupados por día
  const slotsPerDay: Map<string, number> = new Map();
  
  for (const p of sortedPosts) {
    const dateKey = formatDate(getVisualDate(p)); // Recursivo
    slotsPerDay.set(dateKey, (slotsPerDay.get(dateKey) || 0) + 1);
  }

  // Encontrar próximo slot libre
  while (true) {
    if (isBusinessDay(currentDate)) {
      const dateKey = formatDate(currentDate);
      const occupied = slotsPerDay.get(dateKey) || 0;
      
      if (occupied < dailyLimit) {
        return { date: currentDate, isOverloaded: false };
      }
    }
    currentDate = addDays(currentDate, 1);
  }
}
```

### Días Hábiles
- Lunes a Viernes únicamente
- Función helper: `isBusinessDay(date): boolean`

---

## 3.3 Efecto Dominó (Ripple Effect)

### Disparadores
- Crear/eliminar tarea Anclada
- Modificar fecha de tarea Anclada
- Cambiar prioridad via Drag & Drop
- Cambiar tipo de tarea (Flow ↔ Pinned)

### Comportamiento
1. Recalcular fechas visuales de TODAS las tareas Flow
2. Ejecutar en tiempo real (frontend)
3. No afectar tareas Pinned

---

## 3.4 Drag & Drop con Re-numeración

### Requisitos
- [ ] Arrastrar filas para cambiar prioridad
- [ ] Re-numeración compacta inmediata (1, 2, 3... sin huecos)
- [ ] Recálculo de fechas en tiempo real
- [ ] Optimistic updates (UI primero, luego sync)

### Restricciones de D&D
| Estado | Puede reordenarse |
|--------|-------------------|
| Borrador | ✅ |
| Pendiente | ✅ |
| Rechazado | ✅ |
| Aprobado | ✅ |
| Terminado | ❌ (solo Admin) |
| Publicado | ❌ (solo Admin) |

### Implementación con @dnd-kit
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (active.id !== over?.id) {
    const oldIndex = posts.findIndex(p => p.id === active.id);
    const newIndex = posts.findIndex(p => p.id === over?.id);
    
    // Reordenar array
    const reordered = arrayMove(posts, oldIndex, newIndex);
    
    // Re-numerar prioridades
    const renumbered = reordered.map((post, i) => ({
      ...post,
      priority_index: i + 1
    }));
    
    // Actualizar estado local
    setPosts(renumbered);
    
    // Sync con Firestore
    batchUpdatePriorities(renumbered);
  }
}
```

---

## 3.5 Conflictos de Anclaje

### Reglas
- Si un día tiene todos los slots ocupados por Pinned → Bloquear
- Mostrar mensaje claro de conflicto
- No permitir "forzar" por encima de capacidad

### UI de Conflicto
```typescript
if (isPinnedConflict(date, clientId)) {
  showToast({
    type: 'error',
    message: `El día ${formatDate(date)} ya tiene todos los slots ocupados.`
  });
  return false;
}
```

---

## 3.6 Contenido Estancado (Stale Content)

### Definición
- Tarea Flow que se desplaza **+4 semanas** desde su posición original

### Comportamiento
- NO bloquea la tarea
- NO cambia su estado
- Genera **alerta visual pasiva** (icono/color)
- Visible para: Admin, Manager

### Cálculo
```typescript
function isStale(post: Post): boolean {
  if (post.type !== 'flow') return false;
  
  const originalDate = post.createdAt;
  const visualDate = calculateVisualDate(post);
  const weeksDiff = differenceInWeeks(visualDate, originalDate);
  
  return weeksDiff > 4;
}
```

### UI
- Icono de alerta ⚠️ en la fila
- Borde naranja tenue en la card
- Tooltip con días de desplazamiento

---

## 3.7 Vista de Cola (Queue View)

### Requisitos
- [ ] Visualización de toda la cola por cliente
- [ ] Fechas visuales calculadas mostrando semana
- [ ] Indicadores de sobrecarga semanal
- [ ] Toggle para ver solo tareas activas

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Cliente: DUTS Agency    Capacidad: 3/semana            │
├─────────────────────────────────────────────────────────┤
│ SEMANA 1 (Feb 10-14)  [3 slots]  ✅                    │
│ ├── #1 🌊 Branding - Lanzamiento      [Pendiente]     │
│ ├── #2 ⚓ Venta - Promo San Valentín  [Aprobado]      │
│ └── #3 🌊 Educativo - Tips           [Borrador]       │
├─────────────────────────────────────────────────────────┤
│ SEMANA 2 (Feb 17-21)  [4 slots]  ⚠️ Sobrecarga        │
│ ├── #4 🌊 Meme - Trending            [Borrador]       │
│ ├── #5 ⚓ Venta - Descuentos Feb     [Pendiente]      │
│ ├── #6 🌊 Branding - BTS             [Borrador]       │
│ └── #7 🌊 Educativo - FAQ            [Borrador] ⚠️    │
└─────────────────────────────────────────────────────────┘
```

---

## 3.8 Índice de Prioridad Global

### Características
- Único por cliente (no se reinicia)
- Puede crecer indefinidamente (#1000+)
- Rendimiento no debe degradarse

### Optimización Firestore
```typescript
// Query eficiente con índice compuesto
const postsQuery = query(
  collection(db, 'posts'),
  where('client_id', '==', clientId),
  where('status', 'not-in', ['published']), // Excluir publicados
  orderBy('priority_index', 'asc'),
  limit(100) // Paginar si necesario
);
```

---

## Entregables

| Entregable | Criterio |
|------------|----------|
| Algoritmo Slots | Fechas visuales correctas |
| Ripple Effect | Recálculo en tiempo real |
| Drag & Drop | Reorden fluido |
| Re-numeración | Sin huecos en prioridades |
| Conflictos Anclas | Bloqueo cuando lleno |
| Alertas Stale | Icono +4 semanas |
| Vista Cola | Agrupación por semana |

---

⬅️ [FASE 2](./FASE_2_CONTENT_FACTORY.md) | ➡️ [FASE 4](./FASE_4_PWA_REFINAMIENTO.md)
