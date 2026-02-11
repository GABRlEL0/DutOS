# 🎯 DUTOS - Content Operating System

Sistema Operativo de Contenidos para agencias de marketing. Gestiona el flujo de trabajo de creación y aprobación de contenido para redes sociales.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-10-orange) ![PWA](https://img.shields.io/badge/PWA-Ready-green)

---

## ✨ Características

- 📋 **Gestión de Clientes** - CRUD completo con pilares estratégicos
- ✍️ **Flujo de Posts** - Crear, editar, aprobar, rechazar
- 💬 **Comentarios** - Chat en tiempo real y @menciones por post
- 📝 **Templates** - Plantillas reutilizables para contenido
- 🎨 **Brand Kit** - Gestión de identidad de marca por cliente
- 🔔 **Notificaciones** - Push notifications para actividad relevante
- 📅 **Algoritmo de Slots** - Fechas automáticas según capacidad
- 📊 **Dashboard SLA** - Métricas de rendimiento y tiempos de respuesta
- 👥 **Gestión de Usuarios** - Roles y permisos (Admin/Manager/Creative/Production)
- 📱 **PWA** - Instalable, funciona offline
- 📤 **CSV Import/Export** - Carga masiva y backup
- 🎯 **Mobile First** - Swipe gestures, bottom nav

---

## 🚀 Quick Start

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/dutos-app.git
cd dutos-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# Iniciar desarrollo
npm run dev
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Manual de Usuario](./docs/USER_MANUAL.md) | Guía para usuarios finales |
| [Documentación del Sistema](./docs/SYSTEM_DOCUMENTATION.md) | Arquitectura y modelos |
| [Guía de Pruebas (QA)](./docs/QA_TESTING_GUIDE.md) | Plan paso a paso para testers |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Backend**: Firebase (Auth, Firestore)
- **PWA**: VitePWA + Workbox
- **Drag & Drop**: @dnd-kit

---

## 📁 Estructura

```
src/
├── components/    # Componentes React
├── pages/         # Páginas/rutas
├── stores/        # Estado Zustand
├── utils/         # Utilidades
├── types/         # TypeScript types
└── services/      # Firebase config
```

---

## 🔐 Roles

| Rol | Acceso |
|-----|--------|
| Admin | Todo |
| Manager | Clientes, posts, aprobar |
| Creative | Crear/editar posts |
| Production | Ver posts aprobados |

---

## 🚀 Deploy

```bash
# Build producción
npm run build

# Deploy a Firebase Hosting
firebase deploy
```

---

## 📄 License

MIT
