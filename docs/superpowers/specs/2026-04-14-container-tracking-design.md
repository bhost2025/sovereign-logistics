# Container Tracking SaaS — Especificación de Diseño
**Fecha:** 2026-04-14  
**Proyecto:** Sovereign Logistics — Sistema de rastreo de contenedores China → México  
**Stack aprobado:** Supabase + Next.js 14 + React Native (Expo)  
**Estado:** Aprobado para implementación

---

## 1. Visión General

Sistema SaaS multi-tenant para rastrear contenedores de importación desde China hacia México, accesible vía web y app móvil nativa (iOS/Android). El sistema cubre el ciclo completo del contenedor: desde la salida en puerto chino hasta la entrega final en México, con soporte para carga consolidada (LCL) donde un contenedor puede pertenecer a múltiples clientes finales.

**Escala inicial:** ~400 contenedores/año por empresa logística.  
**Usuarios iniciales:** 1 Super Admin, 1 Operador, 2 Directores.  
**Arquitectura:** Multi-tenant desde el día 1, con Row Level Security en PostgreSQL.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Base de datos | PostgreSQL via Supabase | Auth + RLS + Storage incluidos |
| Auth & RBAC | Supabase Auth + RLS | JWT nativo, multi-tenant sin código extra |
| Backend API | Next.js 14 API Routes | Serverless, comparte tipos con frontend |
| Web Frontend | Next.js 14 + Tailwind CSS + shadcn/ui | App Router, SSR, composable |
| App Móvil | React Native (Expo) | Tipos TypeScript compartidos con web |
| Storage | Supabase Storage | PDFs de facturas y Packing Lists |
| Notificaciones email | Resend o SendGrid via Edge Functions | **Fase 2** |
| Realtime | Supabase Realtime | **Fase 2** |
| Tracking automático | Project44 / APIs navieras (B/L) | **Fase 2** |
| OCR facturas | IA extracción de PDFs | **Fase 2** |
| WhatsApp | Twilio / Meta Cloud API | **Fase 2** |

**Design System:** "Sovereign Intelligence" — Manrope, fondo #f7fafc, modo claro editorial McKinsey/Apple. Sin bordes 1px, separación por tonal shifts. Paleta deuteranopia-safe (azul/naranja/ámbar/teal/slate).

---

## 3. Esquema de Base de Datos

### 3.1 ENUMs

```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'operator',
  'director',
  'client_viewer'  -- Fase 2
);

CREATE TYPE container_status AS ENUM (
  'en_puerto_origen',
  'zarpo',
  'en_transito_maritimo',
  'eta_puerto_destino',
  'en_aduana',
  'liberado_aduana',
  'detenido_aduana',
  'transito_terrestre',
  'entregado'
);
```

### 3.2 Tablas

```sql
-- Tenants: empresas logísticas
CREATE TABLE companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  logo_url    text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Usuarios internos del sistema (vinculados a Supabase Auth)
CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  company_id  uuid NOT NULL REFERENCES companies(id),
  full_name   text NOT NULL,
  email       text NOT NULL,
  role        user_role NOT NULL DEFAULT 'operator',
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Clientes finales de la empresa logística
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id),
  name          text NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- Contenedores — objeto central del sistema
CREATE TABLE containers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id),
  container_number text UNIQUE NOT NULL,
  bl_number        text,                        -- Bill of Lading, para API navieras (Fase 2)
  origin_port      text NOT NULL,
  destination_port text NOT NULL DEFAULT 'Manzanillo',
  current_status   container_status NOT NULL DEFAULT 'en_puerto_origen',
  departure_date   date,
  eta_date         date,
  arrival_date     date,
  notes            text,
  created_by       uuid REFERENCES users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_containers_company ON containers(company_id);
CREATE INDEX idx_containers_status  ON containers(current_status);

-- Pivot LCL: un contenedor puede tener N clientes finales
CREATE TABLE container_clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES clients(id),
  share_pct     numeric(5,2),                  -- % de la carga (opcional)
  created_at    timestamptz DEFAULT now(),
  UNIQUE(container_id, client_id)
);

-- Facturas / Packing Lists por cliente dentro de un contenedor
CREATE TABLE invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    uuid NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id),
  invoice_number  text NOT NULL,
  description     text,
  declared_value  numeric(12,2),
  currency        text DEFAULT 'USD',
  file_url        text,                         -- Supabase Storage path
  created_at      timestamptz DEFAULT now()
);

-- Historial completo de cambios de estado
CREATE TABLE container_status_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id     uuid NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  previous_status  container_status,
  new_status       container_status NOT NULL,
  changed_by       uuid REFERENCES users(id),
  notes            text,
  changed_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_status_log_container ON container_status_log(container_id);
```

### 3.3 Row Level Security (Multi-tenant)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_clients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_status_log ENABLE ROW LEVEL SECURITY;

-- SELECT: todos los roles ven datos de su empresa
CREATE POLICY "select_containers" ON containers FOR SELECT
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- INSERT/UPDATE/DELETE: solo operator y super_admin (directores excluidos)
CREATE POLICY "mutate_containers" ON containers FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('operator', 'super_admin')
  );

CREATE POLICY "update_containers" ON containers FOR UPDATE
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('operator', 'super_admin')
  );

CREATE POLICY "delete_containers" ON containers FOR DELETE
  USING (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );
```

---

## 4. Arquitectura de la Aplicación

### 4.1 Estructura de carpetas (Monorepo)

```
/
├── apps/
│   ├── web/                    # Next.js 14
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, registro
│   │   │   ├── dashboard/      # Vista Director
│   │   │   ├── tablero/        # Vista Operador (Kanban)
│   │   │   ├── contenedores/   # CRUD contenedores
│   │   │   ├── clientes/       # CRUD clientes
│   │   │   ├── facturas/       # Gestión facturas
│   │   │   └── admin/          # Super Admin
│   │   └── components/
│   └── mobile/                 # Expo React Native
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx   # Lista contenedores
│       │   │   └── perfil.tsx
│       │   └── contenedor/[id]/
│       │       └── estado.tsx  # Actualizar estado
│       └── components/
├── packages/
│   ├── db/                     # Tipos TypeScript generados de Supabase
│   ├── ui/                     # Componentes compartidos (design system)
│   └── utils/                  # Lógica compartida
└── supabase/
    ├── migrations/             # SQL migrations
    └── functions/              # Edge Functions (notificaciones, Fase 2)
```

### 4.2 Rutas y acceso por rol

| Ruta | Super Admin | Operador | Director | Cliente (Fase 2) |
|---|:---:|:---:|:---:|:---:|
| `/dashboard` | ✅ | ❌ | ✅ | ❌ |
| `/tablero` | ✅ | ✅ | ❌ | ❌ |
| `/contenedores` | ✅ | ✅ | ❌ | ❌ |
| `/contenedores/[id]` | ✅ | ✅ | ✅ (read) | ✅ (sus items) |
| `/clientes` | ✅ | ✅ | ❌ | ❌ |
| `/admin` | ✅ | ❌ | ❌ | ❌ |
| `/mi-carga` | ❌ | ❌ | ❌ | ✅ |

---

## 5. RBAC — Roles y Permisos

| Acción | Super Admin | Operador | Director | Cliente Final |
|---|:---:|:---:|:---:|:---:|
| Configurar sistema / catálogos | ✅ | ❌ | ❌ | ❌ |
| Crear / editar usuarios | ✅ | ❌ | ❌ | ❌ |
| CRUD contenedores | ✅ | ✅ | ❌ | ❌ |
| Cambiar estado de contenedor | ✅ | ✅ | ❌ | ❌ |
| Cargar facturas / PDFs | ✅ | ✅ | ❌ | ❌ |
| Ver tablero Kanban | ✅ | ✅ | ❌ | ❌ |
| Ver dashboard dirección | ✅ | ❌ | ✅ | ❌ |
| Ver sus propios contenedores | ✅ | ✅ | ✅ | ✅ (Fase 2) |

**Implementación:** Middleware de Next.js valida el rol JWT en cada ruta. RLS de Supabase refuerza a nivel de BD como segunda línea de defensa.

---

## 6. Módulos Visuales

### 6.1 Dashboard del Director (`/dashboard`)
- **KPIs superiores:** Activos, En Proceso, Detenidos ▲, Entregados ✓, Programados, Inactivos
- **Acento visual:** barra de 3px en parte superior de cada KPI card con color semántico
- **Tabla central:** contenedores activos con número, cliente, puerto origen, ETA y status badge
- **Panel de alertas:** contenedores detenidos o sin actualización — ordenados por urgencia
- **Leyenda de estados:** strip inferior con barra lateral + nombre para cada estado
- Acceso: Director + Super Admin. Solo lectura para Director.

### 6.2 Tablero Kanban del Operador (`/tablero`)
- **9 columnas:** una por estado del viaje, con acento de color en borde superior
- **Cards:** número de contenedor, cliente, ruta, ETA, badge de estado con barra lateral
- **Contenedores LCL:** etiqueta `LCL` en sky blue
- **Columna Detenido ▲:** triángulo pulsante, counter en naranja, cards con borde izquierdo naranja
- **Filtros:** por estado, LCL, puerto, búsqueda libre
- **Acción:** botón `+ Nuevo Contenedor` siempre visible en topbar

### 6.3 App Móvil del Operador (Expo)
- **Pantalla 1 — Lista:** contenedores ordenados por urgencia, buscador, filtros pill, cards con barra lateral semántica, FAB `+ Registrar`
- **Pantalla 2 — Actualizar estado:** header navy con contexto del contenedor, estado actual destacado, lista de estados posibles con radio buttons grandes (una sola mano), notas opcionales, CTA grande `Confirmar cambio`

---

## 7. Design System — Sovereign Intelligence

### Paleta deuteranopia-safe (sin rojo, verde ni violeta)

| Semántica | Color | Uso |
|---|---|---|
| Primary / Brand | `#0A1A3C` | Botones CTA, headers navy, logo |
| En Tránsito | `#4A6FA5` | Steel blue desaturado |
| En Aduana / Advertencia | `#B8860B` | Ámbar oscuro |
| Detenido ▲ | `#C05A00` | Naranja oscuro — crítico |
| Entregado / Liberado ✓ | `#1A7A8A` | Teal desaturado |
| T. Terrestre | `#7A6A00` | Ámbar oscuro neutro |
| Puerto Origen / Neutro | `#556479` | Slate steel |
| Surface base | `#F7FAFC` | Fondo general |
| Surface card | `#FFFFFF` | Cards y paneles |
| Surface container | `#EBEEf0` | Work-mat / hover |
| Text principal | `#181C1E` | (no negro puro) |
| Text secundario | `#8A9AAA` | Labels, subítems |

### Reglas de diseño
- **Sin bordes 1px** para seccionar — usar tonal shifts y sombras `rgba(24,28,30,0.06)`
- **Tipografía:** Manrope (pesos 500/600/700/800) — única fuente
- **Botones:** `border-radius: 6px` — precision cut, nunca full-radius
- **Status badges:** barra izquierda de 2-3px + ícono símbolo (▲ ◆ ● ✓ ◇) — nunca solo color
- **Glassmorphism:** `backdrop-filter: blur(20-30px)` para topbar y sidebar flotante
- **Shadows:** `0 2px 40px rgba(24,28,30,0.06)` ambient, no box-shadow de colores
- **Labels:** ALL-CAPS + `letter-spacing: 0.1em` + `font-size: 9-10px`

---

## 8. Lógica de Cambio de Estado

### Controlador (Next.js API Route)

```typescript
// POST /api/containers/[id]/status
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Verificar rol — solo operator y super_admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!['operator', 'super_admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { new_status, notes } = await req.json()

  // 2. Obtener estado actual
  const { data: container } = await supabase
    .from('containers')
    .select('current_status, company_id')
    .eq('id', params.id)
    .single()

  // 3. Actualizar estado en contenedor
  await supabase
    .from('containers')
    .update({ current_status: new_status, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  // 4. Registrar en historial
  await supabase.from('container_status_log').insert({
    container_id: params.id,
    previous_status: container.current_status,
    new_status,
    changed_by: user.id,
    notes,
  })

  // 5. Disparar notificación email (Fase 2 — via Supabase Edge Function)
  // await triggerStatusNotification({ containerId: params.id, newStatus: new_status })

  return Response.json({ success: true })
}
```

---

## 9. Fases de Desarrollo

### MVP (Fase 1)
- [ ] Setup monorepo + Supabase project
- [ ] Migrations: schema completo + RLS
- [ ] Auth: login, sesiones, RBAC middleware
- [ ] Web: Dashboard Director + Tablero Kanban
- [ ] Web: CRUD contenedores + cambio de estado + historial
- [ ] Web: CRUD clientes + facturas (upload PDF)
- [ ] Web: Panel Super Admin (usuarios, empresa)
- [ ] Mobile: Lista contenedores + actualizar estado
- [ ] Design system: componentes base (Manrope, paleta, badges)

### Fase 2 — Automatización
- [ ] Notificaciones email (Resend + Edge Functions) al cambiar estado
- [ ] Portal de clientes (`client_viewer`) — seguimiento de su carga
- [ ] Realtime updates en tablero Kanban
- [ ] Alertas WhatsApp (Twilio / Meta Cloud API)

### Fase 3 — Integración
- [ ] Tracking automático via Project44 / APIs Maersk-MSC (Bill of Lading)
- [ ] OCR de facturas PDF (extracción automática de productos y valores)
- [ ] Dashboard analítico avanzado (tendencias, cuellos de botella históricos)

---

## 10. Mockups de Referencia

Ubicados en `docs/mockups/`:
- `dashboard-director.html` — Dashboard del Director (modo claro Sovereign)
- `tablero-operador.html` — Tablero Kanban del Operador
- `app-movil.html` — App móvil (2 pantallas: lista + actualizar estado)
- `contenedor-detalle.html` — Vista detalle de contenedor (timeline + inventario LCL + contratiempo + mensajes)
- `architecture.html` — Diagrama de arquitectura
- `db-schema.html` — Esquema de base de datos visual

Design system de referencia: `stitch_logistics_operations_suite/DESIGN.md`
