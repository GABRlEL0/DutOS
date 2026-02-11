# 📘 DUTOS - Documentación del Sistema

> Sistema Operativo de Contenidos para Agencias de Marketing

---

## 🏗️ Arquitectura

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Estado | Zustand |
| Backend | Firebase (Auth, Firestore) |
| PWA | VitePWA + Workbox |

### Estructura de Carpetas

```
src/
├── components/
│   ├── common/        # Button, Card, Toast, CSVModal
│   ├── layout/        # Layout, BottomNav
│   ├── mobile/        # BottomNav
│   ├── posts/         # PostsTable, QueueView, CommentSection
│   ├── clients/       # BrandKit
│   └── analytics/     # StatCard, SLADashboard
├── pages/
│   ├── auth/          # LoginPage
│   ├── clients/       # ClientsPage, ClientDetailPage
│   ├── posts/         # PostsPage, PostFormPage
│   ├── analytics/     # SLADashboard
│   ├── templates/     # TemplatesPage
│   ├── client/        # Client Portal pages
│   └── settings/      # UsersPage
├── stores/            # Zustand stores (auth, client, post, user)
├── utils/             # slotCalculator, csvUtils, cn
├── types/             # TypeScript interfaces
└── services/firebase/ # Configuración Firebase
```

---

## 🔐 Autenticación y Roles

### Roles del Sistema

| Rol | Permisos |
|-----|----------|
| **admin** | Todo: usuarios, clientes, posts, configuración |
| **manager** | Clientes, posts, aprobar/rechazar, exportar CSV |
| **creative** | Crear/editar posts, ver clientes asignados |
| **production** | Ver posts aprobados, marcar como terminados |

### Flujo de Auth
1. Usuario ingresa email/password
2. Firebase Auth valida credenciales
3. Se busca documento en `/users/{uid}`
4. Se carga rol y permisos en `authStore`

---

## 📊 Modelos de Datos

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'creative' | 'production';
  status: 'active' | 'inactive';
}
```

### Client
```typescript
{
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive';
  weekly_capacity: number;
  drive_links: DriveLinks;
  strategy_pillars: string[];
}
```

### Post
```typescript
{
  id: string;
  client_id: string;
  type: 'flow' | 'pinned';
  pinned_date: Date | null;
  priority_index: number;
  status: PostStatus;
  pillar: string;
  content: { script, caption, asset_link };
  feedback_history: FeedbackEntry[];
}
```

### PostComment
```typescript
{
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  mentions?: string[]; // user_ids
  createdAt: Date;
}
```

### ContentTemplate
```typescript
{
  id: string;
  name: string;
  client_id?: string; // null = global
  script_template: string;
  caption_template: string;
  pillar_suggestion?: string;
  usage_count: number;
}
```

### ContentRequest
```typescript
{
  id: string;
  client_id: string;
  requested_by: string;
  title: string; // Idea/Tema
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  priority: 'low' | 'normal' | 'urgent';
  converted_post_id?: string;
}
```

---

## 🧮 Algoritmo de Slots

El algoritmo `calculateVisualDates()` asigna fechas visuales a los posts:

1. **Posts Pinned**: Fecha fija definida por el usuario
2. **Posts Flow**: Fecha calculada según:
   - `weekly_capacity` del cliente
   - Solo días hábiles (L-V)
   - Orden por `priority_index`

### Detección de Contenido Stale
- Posts con fecha visual > 4 semanas desde hoy
- Indicador visual: borde naranja + ícono ⚠️

---

## 📱 PWA

### Configuración
- `vite.config.ts`: VitePWA plugin
- Manifest: `/public/manifest.json`
- Icons: `/public/icons/` (72-512px)

### Offline
- Workbox con estrategia NetworkFirst
- Cache de assets estáticos (JS, CSS, imágenes)

---

## 🔧 Configuración Local

```bash
# Instalar dependencias
npm install

# Variables de entorno (.env)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...

# Desarrollo
npm run dev

# Build producción
npm run build
```

---

## 📤 Despliegue

### Firebase Hosting
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login y deploy
firebase login
firebase deploy
```

### Security Rules
Las reglas de Firestore están en `firestore.rules` y se despliegan con:
```bash
firebase deploy --only firestore:rules
```
