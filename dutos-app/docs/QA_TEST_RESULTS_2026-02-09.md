# DUTOS QA - Test Results

Date: 2026-02-09T18:10:11-03:00
Workspace: /Users/gabrielcarranza/Documents/Desarrollo/DutOS/dutos-app
Node: v22.19.0
npm: 10.9.3

## Scope

This file documents execution status for the cases defined in `dutos-app/docs/QA_TESTING_GUIDE.md`.

Limitations:
- I cannot take interactive control of a GUI browser from this environment, so the step-by-step UI validations are marked as BLOCKED unless they can be verified via CLI.
- The QA guide requires seeded users for each role in Firebase Auth + corresponding role data in Firestore; those prerequisites were not validated via CLI.

## Environment / Build Checks

### Dev server

Command:
```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Result: PASS (Vite started and served `http://127.0.0.1:5173/`).

### Lint

Command:
```bash
npm run lint
```

Result: FAIL

Key findings (eslint):
- `src/components/clients/BrandKit.tsx`: unused `error`; `any` usage.
- `src/components/common/Badge.tsx`: `react-refresh/only-export-components`.
- `src/components/common/Toast.tsx`: `react-refresh/only-export-components`.
- `src/components/posts/CommentSection.tsx`: unused `_clientId`.
- `src/components/posts/QueueView.tsx`: unused `clients`, `setSelectedClient`.
- `src/pages/TemplatesPage.tsx`: unused `isLoading`, unused `error`.
- `src/pages/analytics/SLADashboard.tsx`: `any` usage.
- `src/pages/auth/LoginPage.tsx`: unused `err`.
- `src/pages/clients/ClientFormPage.tsx`: `react-hooks/set-state-in-effect`.
- `src/pages/posts/PostFormPage.tsx`: `react-hooks/set-state-in-effect`.
- `src/services/firebase/messaging.ts`: `any` usage.
- `src/stores/*Store.ts`: multiple `any` usages; unused `_userId`.

### Production build

Command:
```bash
npm run build
```

Result: FAIL

TypeScript errors:
- `src/components/posts/QueueView.tsx`: TS6133 unused `clients`.
- `src/components/posts/QueueView.tsx`: TS6133 unused `setSelectedClient`.
- `src/pages/TemplatesPage.tsx`: TS6133 unused `isLoading`.

Impact: production build is currently blocked until these TS errors are resolved.

## Manual QA Cases (from QA_TESTING_GUIDE.md)

Legend: PASS / FAIL / BLOCKED / NOT RUN

### 1) Authentication and Security

| Case ID | Description | Status | Notes |
|---|---|---|---|
| A01-A | Login with valid credentials -> redirect to dashboard | BLOCKED | Requires interactive browser + valid seeded users |
| A01-B | Wrong password -> "Error al iniciar sesion" | BLOCKED | UI message verification |
| A01-C | Unknown email -> "Usuario no encontrado" | BLOCKED | UI message verification |
| A01-D | Logout -> redirect to /login | BLOCKED | UI flow |
| A01-E | Access `/` unauthenticated -> forced redirect to /login | BLOCKED | Route guard validation |

### 2) Admin

| Case ID | Description | Status | Notes |
|---|---|---|---|
| U01-A | Create Creative user -> appears in list | BLOCKED | Requires Admin session + Firebase write |
| U01-B | Create user with existing/bad email -> validation error | BLOCKED | UI/validation |
| U01-C | Edit user role Creative->Manager -> reflected instantly | BLOCKED | UI + realtime update |
| U01-D | Deactivate user -> login fails | BLOCKED | Requires multi-user login attempts |
| U01-E | Reactivate user -> login works again | BLOCKED | Requires multi-user login attempts |
| C01-A | Create client "QA Test" cap 5 pillars "Ventas, Branding" | BLOCKED | Requires Admin session |
| C01-B | Create client missing name/capacity -> button disabled/error | BLOCKED | UI validation |
| C01-C | Edit client cap 10 + add Drive link -> persists | BLOCKED | UI + persistence |
| C01-D | Search "QA" -> only created client shown | BLOCKED | UI filtering |
| B01-A | Client detail -> Brand Kit section | BLOCKED | UI navigation |
| B01-B | Add color #FF5733 name "Naranja" -> shows in palette | BLOCKED | UI + persistence |
| B01-C | Add font "Roboto" -> listed | BLOCKED | UI + persistence |
| B01-D | Add logo asset link -> listed | BLOCKED | UI + persistence |
| B01-E | Reload page -> Brand Kit persists | BLOCKED | UI + persistence |
| S01-A | Open `/analytics/sla` | BLOCKED | UI navigation |
| S01-B | SLA loads without errors (even with 0 data) | BLOCKED | UI + data fetching |
| S01-C | Filter by "QA Test" -> metrics go to 0 if new | BLOCKED | UI + data correctness |

### 3) Manager

| Case ID | Description | Status | Notes |
|---|---|---|---|
| T01-A | Create global template (no client) -> available for all | BLOCKED | UI + permissions |
| T01-B | Create template assigned to "QA Test" -> only for that client | BLOCKED | UI + access control |
| T01-C | Edit existing template and save | BLOCKED | UI + persistence |
| P01-A | Create post for "QA Test" from "Plantilla QA" -> prefilled | BLOCKED | UI + template application |
| P01-B | Edit post copy and save | BLOCKED | UI + persistence |
| P01-C | Move to Pendiente, approve from table -> estado "Aprozado" | BLOCKED | Note: guide says "Aprozado" (typo?) |
| P01-D | Move to Pendiente, reject -> requires reason "Corregir ortografia" -> Rechazado | BLOCKED | UI validation + workflow |
| P01-E | Open rejected post -> history shows reason | BLOCKED | UI history |
| COM-01 | Comment "Hola @Creative" -> appears w/ timestamp | BLOCKED | Realtime comments |
| COM-02 | Comment counter badge increases in table | BLOCKED | UI badge |
| Q01-A | Drag post between weeks -> date updates visually | BLOCKED | Drag and drop UX |
| Q01-B | Create 6 posts, cap 5 -> 6th shows overload alert | BLOCKED | Capacity rules |
| Q01-C | Old posts (+4 weeks) show orange border (stale) | BLOCKED | Visual state |

### 4) Creative

| Case ID | Description | Status | Notes |
|---|---|---|---|
| R01-A | Try to view `/users` -> denied/redirect | BLOCKED | Role-based access |
| R01-B | Try to approve own post -> option unavailable | BLOCKED | Role-based UI |
| R01-C | Try to edit Brand Kit -> read-only | BLOCKED | Role-based UI |
| W01-A | Filter table by "Mis Posts" or status Rechazado | BLOCKED | UI filters |
| W01-B | Edit rejected post and fix per feedback | BLOCKED | Workflow |
| W01-C | Change status Rechazado -> Pendiente | BLOCKED | Workflow |

### 5) Production

| Case ID | Description | Status | Notes |
|---|---|---|---|
| F01-A | Filter table by Aprobado | BLOCKED | Role-based view |
| F01-B | Open post, mark asset ready / paste final link | BLOCKED | UI + data |
| F01-C | Change status to Terminado -> disappears from production view | BLOCKED | Workflow + visibility |

### 6) Client

| Case ID | Description | Status | Notes |
|---|---|---|---|
| CP01-A | Client login -> redirect to `/client` | BLOCKED | Role routing |
| CP01-B | Client menu differs (Inicio/Contenido/Solicitudes/Brand Kit) | BLOCKED | UI |
| CP01-C | Client can view Brand Kit but not edit | BLOCKED | Permissions |
| CP02-A | Content shows post that Production marked Terminado | BLOCKED | Cross-role workflow |
| CP02-B | Approve post -> final state Publicado (or ready) | BLOCKED | Workflow |
| CP02-C | Request changes -> post returns to flow (Rechazado or similar) | BLOCKED | Workflow |
| REQ-01 | Client creates request "Video de Navidad" priority Alta | BLOCKED | UI + persistence |
| REQ-02 | Admin/Manager `/requests` sees request; responds "Ok, lo agendamos" | BLOCKED | Cross-role workflow |
| REQ-03 | Client sees Admin response | BLOCKED | Realtime/persistence |

### 7) Mobile (Responsive)

| Case ID | Description | Status | Notes |
|---|---|---|---|
| M01-A | Bottom nav visible instead of sidebar | BLOCKED | Needs mobile viewport/browser |
| M01-B | Tables become cards/scrollable lists | BLOCKED | Needs mobile viewport/browser |
| M01-C | Action buttons are finger-friendly | BLOCKED | Needs mobile viewport/browser |
| G01-A | Open `/tareas` (Mis Tareas) | BLOCKED | Needs mobile viewport/browser |
| G01-B | Swipe right -> positive action | BLOCKED | Needs touch/swipe |
| G01-C | Swipe left -> negative action | BLOCKED | Needs touch/swipe |

### 8) Edge cases

| Case ID | Description | Status | Notes |
|---|---|---|---|
| E01-A | Create post without client/pillar -> error | BLOCKED | UI validation |
| E01-B | 2000-char caption -> UI holds up | BLOCKED | UI stress test |
| E01-C | Offline navigation -> cached content (PWA) | BLOCKED | Requires browser + network toggling |
| E01-D | Offline create/sync on reconnect | BLOCKED | Depends on offline feature support |
| E02-A | Deep link to post as unauthorized user -> access denied | BLOCKED | Cross-tenant authorization |

## Notes / Risks

- Current repository state does not pass lint or production build; fix these before considering QA complete.
- QA guide includes multiple realtime/offline cases; consider adding an automated e2e runner (Playwright/Cypress) to cover core flows.
