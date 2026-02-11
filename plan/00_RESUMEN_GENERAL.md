# 🚀 DUTOS - Plan de Desarrollo por Etapas

## Resumen del Proyecto

**DUTS OS** es una Progressive Web App (PWA) de gestión operativa diseñada para agencias de marketing bajo la filosofía "Strategy-First". El sistema centraliza la gestión de contenido vinculándolo a pilares estratégicos y gestiona la carga de trabajo mediante cuotas semanales y colas de prioridad.

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend/DB | Firebase (Firestore & Authentication) |
| Hosting | Vercel o Firebase Hosting |
| Tipo | PWA (Progressive Web App) |

---

## Estructura del Plan

El desarrollo se divide en **4 Fases principales** + **1 Fase de preparación**:

| Fase | Nombre | Archivo | Descripción |
|------|--------|---------|-------------|
| 0 | Setup Inicial | [FASE_0_SETUP.md](./FASE_0_SETUP.md) | Configuración del proyecto y entorno |
| 1 | Base & Estrategia | [FASE_1_BASE_ESTRATEGIA.md](./FASE_1_BASE_ESTRATEGIA.md) | Firebase, Auth, ABM Clientes |
| 2 | Content Factory | [FASE_2_CONTENT_FACTORY.md](./FASE_2_CONTENT_FACTORY.md) | CRUD de Posts, Vista de Tabla Desktop |
| 3 | Lógica Inteligente | [FASE_3_LOGICA_INTELIGENTE.md](./FASE_3_LOGICA_INTELIGENTE.md) | Algoritmo Slots/Anclas, D&D |
| 4 | PWA & Refinamiento | [FASE_4_PWA_REFINAMIENTO.md](./FASE_4_PWA_REFINAMIENTO.md) | Mobile, Push Notifications, UX |

---

## Roles del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN / ESTRATEGA                        │
│  • Acceso total • CRUD Clientes • Gestión Usuarios          │
└─────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────┬──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    MANAGER      │   │    CREATIVO     │   │   PRODUCCIÓN    │
│ • Aprueba/Rechaza│   │ • Redacta guiones│   │ • Mis Tareas    │
│ • Gestiona cola │   │ • Carga masiva  │   │ • Links finales │
│ • Semáforo      │   │ • Desktop       │   │ • Assets brutos │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │
         ▼
┌─────────────────┐
│ CLIENTE (Futuro)│
│ • Solo lectura  │
└─────────────────┘
```

---

## Workflow de Estados

```
┌──────────┐     ┌─────────────────────┐     ┌───────────┐
│ Borrador │◄───►│ Pendiente Aprobación │────►│ Rechazado │
└──────────┘     └─────────────────────┘     └─────┬─────┘
                         │                         │
                         ▼                         │
                  ┌──────────┐                    │
                  │ Aprobado │◄───────────────────┘
                  └────┬─────┘   (tras corrección)
                       │
                       ▼
                 ┌───────────┐
                 │ Terminado │
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐     ┌──────────┐
                 │ Publicado │────►│ Borrador │ (Admin rollback)
                 └───────────┘     └──────────┘
```

---

## Estimación de Tiempos

| Fase | Duración Estimada | Complejidad |
|------|-------------------|-------------|
| 0 - Setup | 1-2 días | 🟢 Baja |
| 1 - Base & Estrategia | 1-2 semanas | 🟡 Media |
| 2 - Content Factory | 2-3 semanas | 🟠 Media-Alta |
| 3 - Lógica Inteligente | 2-3 semanas | 🔴 Alta |
| 4 - PWA & Refinamiento | 1-2 semanas | 🟡 Media |

**Total Estimado:** 7-10 semanas

---

## Criterios de Éxito por Fase

Cada fase debe cumplir:
1. ✅ Funcionalidad completa según especificación
2. ✅ Tests unitarios para lógica crítica
3. ✅ Documentación de código
4. ✅ Review de código
5. ✅ Validación con stakeholder

---

## Navegación

➡️ Siguiente: [FASE_0_SETUP.md](./FASE_0_SETUP.md)
