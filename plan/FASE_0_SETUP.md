# 🛠️ FASE 0: Setup Inicial del Proyecto

**Duración estimada:** 1-2 días  
**Complejidad:** 🟢 Baja  
**Dependencias:** Ninguna

---

## Objetivo

Configurar el entorno de desarrollo completo, crear la estructura del proyecto y preparar todas las herramientas necesarias para comenzar el desarrollo.

---

## Checklist de Tareas

### 0.1 Inicialización del Proyecto React + Vite

- [ ] Crear proyecto con Vite + React + TypeScript
  ```bash
  npm create vite@latest dutos-app -- --template react-ts
  cd dutos-app
  npm install
  ```
- [ ] Configurar estructura de carpetas según arquitectura
- [ ] Configurar ESLint y Prettier
- [ ] Configurar path aliases en `vite.config.ts`

### 0.2 Instalación de Dependencias Core

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Firebase
npm install firebase

# Routing
npm install react-router-dom

# Estado Global (opcional)
npm install zustand

# Utilidades
npm install clsx date-fns

# Iconos
npm install lucide-react

# Drag & Drop (Fase 3)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 0.3 Configuración de Tailwind CSS

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sistema de colores DUTOS
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Estados (Semáforo)
        status: {
          draft: '#9ca3af',      // Gris
          pending: '#fbbf24',     // Amarillo
          rejected: '#ef4444',    // Rojo
          approved: '#22c55e',    // Verde
          finished: '#3b82f6',    // Azul
          published: '#8b5cf6',   // Púrpura
        }
      },
    },
  },
  plugins: [],
}
```

### 0.4 Estructura de Carpetas

```
src/
├── components/
│   ├── common/          # Botones, inputs, modales
│   ├── layout/          # Header, Sidebar, Footer
│   ├── clients/         # Componentes de clientes
│   ├── posts/           # Componentes de posts/contenido
│   └── dashboard/       # Widgets del dashboard
├── pages/
│   ├── auth/            # Login, registro
│   ├── clients/         # Vista de clientes
│   ├── posts/           # Vista de posts
│   └── settings/        # Configuración
├── hooks/               # Custom hooks
├── services/
│   ├── firebase/        # Configuración y servicios Firebase
│   └── api/             # Funciones de API
├── stores/              # Estados globales (Zustand)
├── types/               # TypeScript types/interfaces
├── utils/               # Funciones utilitarias
├── constants/           # Constantes globales
└── assets/              # Imágenes, fuentes, etc.
```

### 0.5 Configuración Firebase

1. **Crear proyecto en Firebase Console:**
   - Ir a [console.firebase.google.com](https://console.firebase.google.com)
   - Crear nuevo proyecto "DUTOS"
   - Habilitar:
     - ✅ Authentication (Email/Password)
     - ✅ Firestore Database
     - ✅ Hosting (opcional para deploy)

2. **Archivo de configuración `src/services/firebase/config.ts`:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

3. **Archivo `.env.local`:**
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 0.6 Configuración PWA Base

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DUTS OS',
        short_name: 'DUTOS',
        description: 'Sistema de gestión operativa para agencias de marketing',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@stores': '/src/stores',
      '@types': '/src/types',
      '@utils': '/src/utils',
    }
  }
})
```

Instalar plugin PWA:
```bash
npm install -D vite-plugin-pwa
```

### 0.7 Configuración de Git

```bash
git init
git add .
git commit -m "Initial setup: React + Vite + Tailwind + Firebase"
```

**.gitignore:**
```
node_modules
dist
.env.local
.env.*.local
*.log
.DS_Store
```

---

## Definición de Types Iniciales

### `src/types/index.ts`:
```typescript
// Roles del sistema
export type UserRole = 'admin' | 'manager' | 'creative' | 'production' | 'client';

// Estados de contenido
export type PostStatus = 
  | 'draft'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'finished'
  | 'published';

// Tipos de tarea
export type PostType = 'flow' | 'pinned';

// Interfaz de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz de Cliente
export interface Client {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive';
  weekly_capacity: number;
  drive_links: DriveLinks;
  strategy_pillars: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Links de Google Drive
export interface DriveLinks {
  root: string;
  strategy_00: string;
  branding_01: string;
  raw_02: string;
  raw_03: string;
  final_04: string;
}

// Feedback
export interface FeedbackEntry {
  user: string;
  comment: string;
  timestamp: Date;
}

// Post/Contenido
export interface Post {
  id: string;
  client_id: string;
  type: PostType;
  pinned_date: Date | null;
  priority_index: number;
  status: PostStatus;
  pillar: string;
  content: {
    script: string;
    caption: string;
    asset_link: string;
  };
  feedback_history: FeedbackEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Entregables de la Fase

| Entregable | Descripción | Criterio de Aceptación |
|------------|-------------|------------------------|
| Proyecto React | Proyecto inicializado con Vite | `npm run dev` funciona |
| Tailwind | CSS configurado con tema DUTOS | Estilos aplican correctamente |
| Firebase | Proyecto configurado en Console | Conexión verificada |
| Estructura | Carpetas y archivos base | Estructura según especificación |
| Types | Interfaces TypeScript | Compila sin errores |
| Git | Repositorio inicializado | Commit inicial realizado |

---

## Navegación

⬅️ [Resumen General](./00_RESUMEN_GENERAL.md)  
➡️ [FASE 1: Base & Estrategia](./FASE_1_BASE_ESTRATEGIA.md)
