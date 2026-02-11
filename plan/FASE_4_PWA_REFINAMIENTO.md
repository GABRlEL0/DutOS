# 📱 FASE 4: PWA & Refinamiento

**Duración estimada:** 1-2 semanas  
**Complejidad:** 🟡 Media  
**Dependencias:** Fase 3 completada

---

## Objetivo

Optimizar la experiencia móvil, implementar notificaciones push, pulir la UX general y preparar el sistema para producción.

---

## 4.1 Optimización PWA

### Manifest Completo
```json
{
  "name": "DUTS OS",
  "short_name": "DUTOS",
  "description": "Sistema de gestión operativa para agencias",
  "theme_color": "#0ea5e9",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72" },
    { "src": "/icons/icon-96.png", "sizes": "96x96" },
    { "src": "/icons/icon-128.png", "sizes": "128x128" },
    { "src": "/icons/icon-144.png", "sizes": "144x144" },
    { "src": "/icons/icon-152.png", "sizes": "152x152" },
    { "src": "/icons/icon-192.png", "sizes": "192x192" },
    { "src": "/icons/icon-384.png", "sizes": "384x384" },
    { "src": "/icons/icon-512.png", "sizes": "512x512" }
  ],
  "screenshots": [
    { "src": "/screenshots/mobile.png", "sizes": "390x844", "type": "image/png" },
    { "src": "/screenshots/desktop.png", "sizes": "1920x1080", "type": "image/png" }
  ]
}
```

### Tareas
- [ ] Generar iconos en todos los tamaños
- [ ] Splash screens para iOS
- [ ] Configurar service worker
- [ ] Cache de assets estáticos
- [ ] Manejo de offline (básico)

---

## 4.2 Optimización Mobile

### Prioridades por Rol en Mobile

| Rol | Vistas Prioritarias |
|-----|---------------------|
| Manager | Aprobación, Feed de Tareas, Dashboard |
| Production | Mis Tareas, Links de assets |
| Creative | Dashboard (secundario) |

### Tareas
- [ ] Touch gestures optimizados (swipe para aprobar/rechazar)
- [ ] Botones de tamaño táctil (min 44x44px)
- [ ] Formularios adaptados (teclado virtual)
- [ ] Navegación bottom bar
- [ ] Pull to refresh

### Componentes Mobile
```
src/components/mobile/
├── BottomNav.tsx
├── SwipeableCard.tsx
├── PullToRefresh.tsx
├── ApprovalSwipe.tsx
└── QuickActionsFAB.tsx
```

---

## 4.3 Web Push Notifications

### Requisitos
- [ ] Solo para rol Manager (Fase 4)
- [ ] Notificar cuando hay contenido pendiente de aprobación
- [ ] Implementar con Firebase Cloud Messaging (FCM)

### Eventos que Disparan Notificación
| Evento | Destinatario | Mensaje |
|--------|--------------|---------|
| Nuevo post pendiente | Manager | "Nuevo contenido de [Cliente] requiere aprobación" |
| Post rechazado corregido | Manager | "[Cliente]: Corrección enviada para revisión" |

### Implementación FCM
```typescript
// src/services/firebase/messaging.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    // Guardar token en Firestore para el usuario
    await saveUserToken(token);
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messaging = getMessaging();
  onMessage(messaging, callback);
};
```

---

## 4.4 Sistema de Badges (Notificaciones In-App)

### Ubicación
- Sidebar (desktop)
- Bottom nav (mobile)
- Dashboard widgets

### Contadores
| Badge | Descripción | Rol |
|-------|-------------|-----|
| 🔴 Pendientes | Posts esperando aprobación | Manager |
| 🟡 Rechazados | Posts rechazados sin corregir | Creative |
| 🟠 Sobrecarga | Semanas con más del 100% capacidad | Admin, Manager |
| ⚠️ Stale | Contenido estancado (+4 sem) | Admin, Manager |

---

## 4.5 UX Polish

### Animaciones y Transiciones
- [ ] Transiciones suaves entre páginas
- [ ] Feedback visual en acciones (ripple, pulse)
- [ ] Skeleton loaders para carga
- [ ] Toast notifications para acciones

### Accesibilidad
- [ ] Labels ARIA en elementos interactivos
- [ ] Contraste de colores WCAG AA
- [ ] Navegación por teclado
- [ ] Focus visible

### Estados de Error
- [ ] Página 404 personalizada
- [ ] Página de error genérico
- [ ] Manejo de errores de red
- [ ] Mensajes de error claros

---

## 4.6 Performance

### Optimizaciones
- [ ] Code splitting por rutas
- [ ] Lazy loading de componentes pesados
- [ ] Optimización de queries Firestore
- [ ] Memoización de cálculos costosos (fechas visuales)

### Métricas Target
| Métrica | Objetivo |
|---------|----------|
| FCP (First Contentful Paint) | < 1.5s |
| TTI (Time to Interactive) | < 3s |
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |

---

## 4.7 Deploy y Producción

### Opciones de Hosting
1. **Vercel** (Recomendado para Vite)
2. **Firebase Hosting**

### Configuración Vercel
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Variables de Entorno Producción
- [ ] Configurar en dashboard de Vercel/Firebase
- [ ] Revisar que no haya secrets en código
- [ ] Configurar dominio personalizado

---

## 4.8 Testing Final

### Checklist Pre-Launch
- [ ] Test en Chrome, Firefox, Safari
- [ ] Test en Android Chrome
- [ ] Test en iOS Safari
- [ ] Instalación PWA en Android
- [ ] Instalación PWA en iOS
- [ ] Permisos de notificación
- [ ] Todos los flujos de usuario por rol
- [ ] Performance audit (Lighthouse)

---

## Entregables

| Entregable | Criterio |
|------------|----------|
| PWA instalable | Manifest completo, iconos |
| Mobile optimizado | Touch gestures, bottom nav |
| Push Notifications | FCM funcionando para Manager |
| Badges | Contadores en navegación |
| Performance | Lighthouse score > 90 |
| Deploy | Aplicación en producción |

---

⬅️ [FASE 3](./FASE_3_LOGICA_INTELIGENTE.md) | 🏁 [Resumen](./00_RESUMEN_GENERAL.md)
